from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json
import os
import re
import subprocess
import tempfile
import threading
import uuid
from typing import Any, Dict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CodeRequest(BaseModel):
    code: str


RUN_TIMEOUT_SECONDS = int(os.getenv("RUN_TIMEOUT_SECONDS", "5"))
WORKER_CONCURRENCY = int(os.getenv("WORKER_CONCURRENCY", "4"))
MAX_QUEUE_LENGTH = int(os.getenv("MAX_QUEUE_LENGTH", "16"))
STDOUT_LIMIT = int(os.getenv("STDOUT_LIMIT", "8192"))
STDERR_LIMIT = int(os.getenv("STDERR_LIMIT", "8192"))

PLOT_CAPTURE_START = "__PLOT_CAPTURE_START__"
PLOT_CAPTURE_END = "__PLOT_CAPTURE_END__"

executor = ThreadPoolExecutor(max_workers=WORKER_CONCURRENCY)
state_lock = threading.Lock()
queued_jobs = 0
running_jobs = 0


def truncate(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[:limit] + "\n...truncated..."


def extract_plots(stdout: str):
    pattern = re.escape(PLOT_CAPTURE_START) + r"(.*?)" + re.escape(PLOT_CAPTURE_END)
    match = re.search(pattern, stdout, flags=re.DOTALL)

    if not match:
        return stdout, []

    raw = match.group(1)

    try:
        data = json.loads(raw)
        if not isinstance(data, list):
            data = []
    except Exception:
        data = []

    cleaned = stdout[:match.start()] + stdout[match.end():]
    return cleaned, data


def run_user_code(code: str) -> Dict[str, Any]:
    wrapped_code = f"""
import sys

try:
    import matplotlib.pyplot as plt
except Exception:
    plt = None

{code}

print({PLOT_CAPTURE_START!r})
try:
    import io
    import base64
    import json
    images = []

    if plt:
        for i in plt.get_fignums():
            fig = plt.figure(i)
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
            buf.seek(0)
            images.append("data:image/png;base64," + base64.b64encode(buf.read()).decode())

    print(json.dumps(images))
except Exception:
    print("[]")
print({PLOT_CAPTURE_END!r})
"""

    temp_file = tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False)
    try:
        temp_file.write(wrapped_code)
        temp_file.flush()
        temp_file.close()

        try:
            process = subprocess.run(
                ["python", temp_file.name],
                capture_output=True,
                text=True,
                timeout=RUN_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired as exc:
            stdout = exc.stdout or ""
            stderr = exc.stderr or ""
            clean_stdout, plots = extract_plots(stdout)

            return {
                "stdout": truncate(clean_stdout, STDOUT_LIMIT),
                "stderr": truncate(stderr or f"Execution timed out after {RUN_TIMEOUT_SECONDS} seconds.", STDERR_LIMIT),
                "plots": plots,
                "exit_code": 124,
                "error": "request timeout",
            }
    finally:
        try:
            temp_file.close()
        except Exception:
            pass
        try:
            os.unlink(temp_file.name)
        except FileNotFoundError:
            pass

    stdout = process.stdout
    stderr = process.stderr

    clean_stdout, plots = extract_plots(stdout)

    return {
        "stdout": truncate(clean_stdout, STDOUT_LIMIT),
        "stderr": truncate(stderr, STDERR_LIMIT),
        "plots": plots,
        "exit_code": process.returncode,
    }


def _run_queued(code: str):
    global queued_jobs, running_jobs

    with state_lock:
        queued_jobs -= 1
        running_jobs += 1

    try:
        return run_user_code(code)
    finally:
        with state_lock:
            running_jobs -= 1


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/run")
def run_code(req: CodeRequest):
    global queued_jobs

    with state_lock:
        if queued_jobs + running_jobs >= MAX_QUEUE_LENGTH:
            return JSONResponse(status_code=429, content={"error": "queue full"})
        queued_jobs += 1

    try:
        future = executor.submit(_run_queued, req.code)
        result = future.result(timeout=RUN_TIMEOUT_SECONDS + 2)
        return result
    except FuturesTimeoutError:
        return JSONResponse(status_code=408, content={"error": "request timeout"})
    finally:
        with state_lock:
            queued_jobs = max(0, queued_jobs - 1)
