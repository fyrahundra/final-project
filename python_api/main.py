from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import subprocess
import os
import shutil
import threading
import uuid
import re
import json
from typing import Any, Dict

app = FastAPI()

# Allow frontend local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

RUNNER_IMAGE = os.getenv("RUNNER_IMAGE", "python:3.11-slim")
DOCKER_BIN = os.getenv("DOCKER_BIN", "docker")
RUN_TIMEOUT_SECONDS = float(os.getenv("RUN_TIMEOUT_SECONDS", "5"))
RUN_MEMORY_LIMIT = os.getenv("RUN_MEMORY_LIMIT", "128m")
RUN_CPU_LIMIT = os.getenv("RUN_CPU_LIMIT", "0.5")
RUN_PIDS_LIMIT = int(os.getenv("RUN_PIDS_LIMIT", "32"))
RUNNER_USER = os.getenv("RUNNER_USER", "65534:65534")
RUNNER_SECCOMP_PROFILE = os.getenv("RUNNER_SECCOMP_PROFILE", "default")
RUNNER_APPARMOR_PROFILE = os.getenv("RUNNER_APPARMOR_PROFILE", "docker-default")

WORKER_CONCURRENCY = int(os.getenv("WORKER_CONCURRENCY", "4"))
MAX_QUEUE_LENGTH = int(os.getenv("MAX_QUEUE_LENGTH", "16"))

STDOUT_LIMIT = int(os.getenv("STDOUT_LIMIT", "8192"))
STDERR_LIMIT = int(os.getenv("STDERR_LIMIT", "8192"))
TRUNCATION_MARKER = "\n...truncated..."
PLOT_CAPTURE_START = "__PLOT_CAPTURE_START__"
PLOT_CAPTURE_END = "__PLOT_CAPTURE_END__"

MATPLOTLIB_CAPTURE_SUFFIX = f"""
try:
    import io as __plot_io
    import base64 as __plot_base64
    import json as __plot_json
    import matplotlib.pyplot as __plot_plt

    __plot_items = []
    for __plot_num in __plot_plt.get_fignums():
        __plot_fig = __plot_plt.figure(__plot_num)
        __plot_buf = __plot_io.BytesIO()
        __plot_fig.savefig(__plot_buf, format=\"png\", dpi=150, bbox_inches=\"tight\")
        __plot_buf.seek(0)
        __plot_items.append(__plot_base64.b64encode(__plot_buf.read()).decode(\"ascii\"))
        __plot_buf.close()

    if __plot_items:
        print({PLOT_CAPTURE_START!r} + __plot_json.dumps(__plot_items) + {PLOT_CAPTURE_END!r})
except Exception:
    pass
"""

FS_POLICY_PREFIX = """
import builtins
import io
import os
import pathlib
import shutil

_ORIGINAL_OPEN = builtins.open
_ORIGINAL_IO_OPEN = io.open

_READ_ALLOWED_PREFIXES = (
    "/usr/local/lib/",
    "/usr/lib/",
    "/usr/X11R6/",
    "/usr/X11/",
    "/lib/",
    "/etc/",
    "/usr/local/share/",
    "/usr/share/",
    "/var/cache/",
    "/home/",
    "/tmp/",
    "/sandbox/",
)

_WRITE_ALLOWED_PREFIXES = (
    "/tmp/",
    "/sandbox/",
)

def _normalize_path(path):
    if not isinstance(path, (str, bytes, os.PathLike)):
        return None
    raw = os.fspath(path)
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8", errors="ignore")
    if not os.path.isabs(raw):
        raw = os.path.abspath(os.path.join(os.getcwd(), raw))
    return os.path.normpath(raw)

def _allowed(path, prefixes):
    return any(path == p[:-1] or path.startswith(p) for p in prefixes)

def _safe_open(path, mode="r", *args, **kwargs):
    normalized = _normalize_path(path)
    if normalized is None:
        raise PermissionError("POLICY_FILESYSTEM_DISABLED")
    is_write = any(flag in str(mode) for flag in ("w", "a", "x", "+"))
    if is_write and not _allowed(normalized, _WRITE_ALLOWED_PREFIXES):
        raise PermissionError("POLICY_FILESYSTEM_DISABLED")
    if not is_write and not _allowed(normalized, _READ_ALLOWED_PREFIXES):
        raise PermissionError("POLICY_FILESYSTEM_DISABLED")
    return _ORIGINAL_OPEN(path, mode, *args, **kwargs)

def _fs_blocked(*args, **kwargs):
    raise PermissionError("POLICY_FILESYSTEM_DISABLED")

def _guard_write_path(path):
    normalized = _normalize_path(path)
    if normalized is None or not _allowed(normalized, _WRITE_ALLOWED_PREFIXES):
        raise PermissionError("POLICY_FILESYSTEM_DISABLED")
    return normalized

def _guard_read_path(path):
    normalized = _normalize_path(path)
    if normalized is None or not _allowed(normalized, _READ_ALLOWED_PREFIXES):
        raise PermissionError(f"POLICY_FILESYSTEM_DISABLED: {normalized}")
    return normalized

_ORIGINAL_MKDIR = os.mkdir
_ORIGINAL_MAKEDIRS = os.makedirs
_ORIGINAL_REMOVE = os.remove
_ORIGINAL_UNLINK = os.unlink
_ORIGINAL_RMDIR = os.rmdir
_ORIGINAL_RMTREE = shutil.rmtree
_ORIGINAL_LISTDIR = os.listdir
_ORIGINAL_SCANDIR = os.scandir
_ORIGINAL_WALK = os.walk
_ORIGINAL_PATH_READ_TEXT = pathlib.Path.read_text
_ORIGINAL_PATH_READ_BYTES = pathlib.Path.read_bytes
_ORIGINAL_PATH_ITERDIR = pathlib.Path.iterdir
_ORIGINAL_PATH_GLOB = pathlib.Path.glob
_ORIGINAL_PATH_RGLOB = pathlib.Path.rglob

def _safe_mkdir(path, mode=0o777, *, dir_fd=None):
    _guard_write_path(path)
    return _ORIGINAL_MKDIR(path, mode=mode, dir_fd=dir_fd)

def _safe_makedirs(name, mode=0o777, exist_ok=False):
    _guard_write_path(name)
    return _ORIGINAL_MAKEDIRS(name, mode=mode, exist_ok=exist_ok)

def _safe_remove(path, *, dir_fd=None):
    _guard_write_path(path)
    return _ORIGINAL_REMOVE(path, dir_fd=dir_fd)

def _safe_unlink(path, *, dir_fd=None):
    _guard_write_path(path)
    return _ORIGINAL_UNLINK(path, dir_fd=dir_fd)

def _safe_rmdir(path, *, dir_fd=None):
    _guard_write_path(path)
    return _ORIGINAL_RMDIR(path, dir_fd=dir_fd)

def _safe_rmtree(path, *args, **kwargs):
    _guard_write_path(path)
    return _ORIGINAL_RMTREE(path, *args, **kwargs)

def _safe_listdir(path="."):
    _guard_read_path(path)
    return _ORIGINAL_LISTDIR(path)

def _safe_scandir(path="."):
    _guard_read_path(path)
    return _ORIGINAL_SCANDIR(path)

def _safe_walk(top, *args, **kwargs):
    _guard_read_path(top)
    return _ORIGINAL_WALK(top, *args, **kwargs)

def _safe_path_read_text(path_obj, *args, **kwargs):
    _guard_read_path(path_obj)
    return _ORIGINAL_PATH_READ_TEXT(path_obj, *args, **kwargs)

def _safe_path_read_bytes(path_obj, *args, **kwargs):
    _guard_read_path(path_obj)
    return _ORIGINAL_PATH_READ_BYTES(path_obj, *args, **kwargs)

def _safe_path_iterdir(path_obj):
    _guard_read_path(path_obj)
    return _ORIGINAL_PATH_ITERDIR(path_obj)

def _safe_path_glob(path_obj, pattern):
    _guard_read_path(path_obj)
    return _ORIGINAL_PATH_GLOB(path_obj, pattern)

def _safe_path_rglob(path_obj, pattern):
    _guard_read_path(path_obj)
    return _ORIGINAL_PATH_RGLOB(path_obj, pattern)

def _safe_io_open(path, mode="r", *args, **kwargs):
    normalized = _normalize_path(path)
    if normalized is None:
        raise PermissionError("POLICY_FILESYSTEM_DISABLED")
    is_write = any(flag in str(mode) for flag in ("w", "a", "x", "+"))
    if is_write and not _allowed(normalized, _WRITE_ALLOWED_PREFIXES):
        raise PermissionError("POLICY_FILESYSTEM_DISABLED")
    if not is_write and not _allowed(normalized, _READ_ALLOWED_PREFIXES):
        raise PermissionError("POLICY_FILESYSTEM_DISABLED")
    return _ORIGINAL_IO_OPEN(path, mode, *args, **kwargs)

builtins.open = _safe_open
io.open = _safe_io_open
pathlib.Path.open = _safe_open
os.listdir = _safe_listdir
os.scandir = _safe_scandir
os.walk = _safe_walk
os.remove = _safe_remove
os.unlink = _safe_unlink
os.rmdir = _safe_rmdir
os.makedirs = _safe_makedirs
os.mkdir = _safe_mkdir
os.rename = _fs_blocked
os.replace = _fs_blocked
shutil.rmtree = _safe_rmtree
shutil.copy = _fs_blocked
shutil.copy2 = _fs_blocked
shutil.copyfile = _fs_blocked
pathlib.Path.read_text = _safe_path_read_text
pathlib.Path.read_bytes = _safe_path_read_bytes
pathlib.Path.write_text = _fs_blocked
pathlib.Path.write_bytes = _fs_blocked
pathlib.Path.iterdir = _safe_path_iterdir
pathlib.Path.glob = _safe_path_glob
pathlib.Path.rglob = _safe_path_rglob
"""

executor = ThreadPoolExecutor(max_workers=WORKER_CONCURRENCY)
state_lock = threading.Lock()
queued_jobs = 0
running_jobs = 0

@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    executor_ready, executor_detail = _executor_readiness()
    with state_lock:
        available_workers = max(0, WORKER_CONCURRENCY - running_jobs)
        queue_used = queued_jobs + running_jobs
    return {
        "status": "ok" if executor_ready else "degraded",
        "executor_ready": executor_ready,
        "executor_detail": executor_detail,
        "worker_concurrency": WORKER_CONCURRENCY,
        "workers_running": running_jobs,
        "workers_available": available_workers,
        "queue_max": MAX_QUEUE_LENGTH,
        "queue_used": queue_used,
        "queue_available": max(0, MAX_QUEUE_LENGTH - queue_used),
        "saturated": queue_used >= MAX_QUEUE_LENGTH,
    }


def _saturated_response() -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "error": "service saturated",
            "message": "queue full, try again later",
            "code": "queue_full",
        },
    )


def _truncate_output(value: str, limit: int) -> str:
    if len(value) < limit:
        return value
    keep = max(0, limit - len(TRUNCATION_MARKER))
    return value[:keep] + TRUNCATION_MARKER


def _bounded_output(value: str, limit: int) -> tuple[str, bool, int]:
    original_length = len(value)
    truncated = original_length >= limit
    return _truncate_output(value, limit), truncated, original_length


def _status_for_error_code(error_code: str) -> int:
    if error_code in {
        "filesystem_disabled",
        "network_disabled",
        "process_creation_disabled",
    }:
        return 403
    if error_code == "timeout_exceeded":
        return 408
    if error_code == "memory_exceeded":
        return 429
    if error_code == "dependency_missing":
        return 422
    return 400


def _extract_plot_payload(stdout: str) -> tuple[str, list[str]]:
    marker_pattern = re.escape(PLOT_CAPTURE_START) + r"(.*?)" + re.escape(PLOT_CAPTURE_END)
    match = re.search(marker_pattern, stdout, flags=re.DOTALL)
    if not match:
        return stdout, []

    payload_text = match.group(1)
    try:
        payload = json.loads(payload_text)
        if not isinstance(payload, list):
            payload = []
        else:
            payload = [item for item in payload if isinstance(item, str)]
    except json.JSONDecodeError:
        payload = []

    cleaned_stdout = stdout[:match.start()] + stdout[match.end():]
    return cleaned_stdout, payload


def _kill_container(container_name: str) -> None:
    subprocess.run(
        [DOCKER_BIN, "rm", "-f", container_name],
        capture_output=True,
        text=True,
        check=False,
    )


def _executor_readiness() -> tuple[bool, str]:
    if not shutil.which(DOCKER_BIN):
        return False, "docker CLI not found in PATH"

    try:
        result = subprocess.run(
            [DOCKER_BIN, "version", "--format", "{{.Server.Version}}"],
            capture_output=True,
            text=True,
            timeout=2,
            check=False,
        )
    except Exception as exc:
        return False, f"docker readiness check failed: {exc}"

    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "docker daemon unavailable"
        return False, detail

    return True, "ready"


def _classify_policy_denial(stderr: str, return_code: int) -> tuple[str, str] | None:
    lower = stderr.lower()

    module_missing = re.search(r"ModuleNotFoundError:\s+No module named '([^']+)'", stderr)
    if module_missing:
        module_name = module_missing.group(1)
        return "dependency_missing", f"dependency missing: {module_name}"

    if "policy_filesystem_disabled" in lower:
        return "filesystem_disabled", "filesystem disabled"

    if return_code == 137 or "memoryerror" in lower or "out of memory" in lower:
        return "memory_exceeded", "memory exceeded"

    network_markers = [
        "network is unreachable",
        "temporary failure in name resolution",
        "failed to establish a new connection",
        "name or service not known",
    ]
    if any(marker in lower for marker in network_markers):
        return "network_disabled", "network disabled"

    fs_markers = [
        "read-only file system",
        "permission denied",
    ]
    if any(marker in lower for marker in fs_markers):
        return "filesystem_disabled", "filesystem disabled"

    process_markers = [
        "resource temporarily unavailable",
        "can't start new thread",
        "cannot allocate memory",
        "operation not permitted",
    ]
    if any(marker in lower for marker in process_markers):
        return "process_creation_disabled", "process creation disabled"

    return None

def matplotlib_handler(code: str) -> int:
    pass

def run_user_code(code: str) -> Dict[str, Any]:
    container_name = f"python-job-{uuid.uuid4().hex[:12]}"
    docker_cmd = [
        DOCKER_BIN,
        "run",
        "--rm",
        "--name",
        container_name,
        "--network",
        "none",
        "--read-only",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=16m",
        "--tmpfs",
        "/sandbox:rw,noexec,nosuid,size=16m,uid=65534,gid=65534",
        "--workdir",
        "/sandbox",
        "--pids-limit",
        str(RUN_PIDS_LIMIT),
        "--cpus",
        str(RUN_CPU_LIMIT),
        "--memory",
        RUN_MEMORY_LIMIT,
        "--memory-swap",
        RUN_MEMORY_LIMIT,
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--user",
        RUNNER_USER,
        "-e",
        "PYTHONDONTWRITEBYTECODE=1",
        "-e",
        "HOME=/sandbox",
        "-e",
        "PYTHONNOUSERSITE=1",
        "-e",
        "MPLCONFIGDIR=/tmp/matplotlib",
        "-i",
    ]

    if RUNNER_SECCOMP_PROFILE and RUNNER_SECCOMP_PROFILE != "default":
        docker_cmd.extend(["--security-opt", f"seccomp={RUNNER_SECCOMP_PROFILE}"])

    if RUNNER_APPARMOR_PROFILE:
        docker_cmd.extend(["--security-opt", f"apparmor={RUNNER_APPARMOR_PROFILE}"])

    docker_cmd.extend([RUNNER_IMAGE, "python", "-I", "-B", "-u", "-"])

    wrapped_code = FS_POLICY_PREFIX + "\n" + code + "\n" + MATPLOTLIB_CAPTURE_SUFFIX

    try:
        process = subprocess.Popen(
            docker_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        try:
            stdout, stderr = process.communicate(wrapped_code, timeout=RUN_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            _kill_container(container_name)
            process.kill()
            return {
                "error": "timeout exceeded",
                "error_code": "timeout_exceeded",
                "stdout": "",
                "stderr": "",
                "output_truncated": False,
                "stdout_truncated": False,
                "stderr_truncated": False,
                "stdout_original_length": 0,
                "stderr_original_length": 0,
            }

        clean_stdout, plot_payload = _extract_plot_payload(stdout)
        plots = [f"data:image/png;base64,{item}" for item in plot_payload]
        bounded_stdout, stdout_truncated, stdout_original_length = _bounded_output(clean_stdout, STDOUT_LIMIT)
        bounded_stderr, stderr_truncated, stderr_original_length = _bounded_output(stderr, STDERR_LIMIT)
        output_truncated = stdout_truncated or stderr_truncated

        denial = _classify_policy_denial(stderr, process.returncode or 0)
        if denial and (process.returncode or 0) != 0:
            error_code, message = denial
            return {
                "error": message,
                "error_code": error_code,
                "stdout": bounded_stdout,
                "stderr": bounded_stderr,
                "plots": plots,
                "output_truncated": output_truncated,
                "stdout_truncated": stdout_truncated,
                "stderr_truncated": stderr_truncated,
                "stdout_original_length": stdout_original_length,
                "stderr_original_length": stderr_original_length,
            }

        return {
            "stdout": bounded_stdout,
            "stderr": bounded_stderr,
            "plots": plots,
            "output_truncated": output_truncated,
            "stdout_truncated": stdout_truncated,
            "stderr_truncated": stderr_truncated,
            "stdout_original_length": stdout_original_length,
            "stderr_original_length": stderr_original_length,
            "exit_code": process.returncode or 0,
        }

    except FileNotFoundError:
        return {
            "error": "executor unavailable",
            "error_code": "executor_unavailable",
            "stdout": "",
            "stderr": "docker CLI not found in API runtime",
            "output_truncated": False,
            "stdout_truncated": False,
            "stderr_truncated": False,
            "stdout_original_length": 0,
            "stderr_original_length": 0,
        }
    except subprocess.TimeoutExpired:
        _kill_container(container_name)
        return {
            "error": "timeout exceeded",
            "error_code": "timeout_exceeded",
            "stdout": "",
            "stderr": "",
            "output_truncated": False,
            "stdout_truncated": False,
            "stderr_truncated": False,
            "stdout_original_length": 0,
            "stderr_original_length": 0,
        }
    except Exception as exc:
        bounded_stderr, stderr_truncated, stderr_original_length = _bounded_output(str(exc), STDERR_LIMIT)
        return {
            "error": "execution failed",
            "error_code": "execution_failed",
            "stdout": "",
            "stderr": bounded_stderr,
            "output_truncated": stderr_truncated,
            "stdout_truncated": False,
            "stderr_truncated": stderr_truncated,
            "stdout_original_length": 0,
            "stderr_original_length": stderr_original_length,
        }


def _run_queued_job(code: str) -> Dict[str, str | int]:
    global queued_jobs, running_jobs
    with state_lock:
        queued_jobs -= 1
        running_jobs += 1
    try:
        return run_user_code(code)
    finally:
        with state_lock:
            running_jobs -= 1

@app.post("/run")
def run_code(req: CodeRequest):
    global queued_jobs

    executor_ready, executor_detail = _executor_readiness()
    if not executor_ready:
        return JSONResponse(
            status_code=503,
            content={
                "error": "executor unavailable",
                "message": "runner backend is not ready",
                "detail": executor_detail,
                "code": "executor_unavailable",
            },
        )

    with state_lock:
        queue_used = queued_jobs + running_jobs
        if queue_used >= MAX_QUEUE_LENGTH:
            return _saturated_response()
        queued_jobs += 1

    try:
        future = executor.submit(_run_queued_job, req.code)
    except Exception:
        with state_lock:
            queued_jobs -= 1
        return JSONResponse(
            status_code=503,
            content={
                "error": "service unavailable",
                "message": "failed to enqueue job",
                "code": "enqueue_failed",
            },
        )

    try:
        result = future.result(timeout=RUN_TIMEOUT_SECONDS + 3)
    except FuturesTimeoutError:
        return JSONResponse(
            status_code=408,
            content={
                "error": "timeout exceeded",
                "error_code": "timeout_exceeded",
                "stdout": "",
                "stderr": "",
                "output_truncated": False,
                "stdout_truncated": False,
                "stderr_truncated": False,
                "stdout_original_length": 0,
                "stderr_original_length": 0,
            },
        )

    if "error" in result:
        error_code = str(result.get("error_code", ""))
        return JSONResponse(status_code=_status_for_error_code(error_code), content=result)
    return result