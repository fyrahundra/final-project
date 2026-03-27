from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import tempfile
import os
import threading

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

@app.get("/")
def root():
    return {"status": "ok"}

def run_user_code(file_path, output_container):
    try:
        result = subprocess.run(
            ["python3", file_path],
            capture_output=True,
            text=True,
            timeout=5,
            check=False
        )
        output_container["stdout"] = result.stdout[:1000]
        output_container["stderr"] = result.stderr[:1000]
    except subprocess.TimeoutExpired:
        output_container["stdout"] = ""
        output_container["stderr"] = "Execution timed out"

@app.post("/run")
def run_code(req: CodeRequest):
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = os.path.join(tmpdir, "code.py")
        with open(file_path, "w") as f:
            f.write(req.code)

        output_container = {}

        thread = threading.Thread(target=run_user_code, args=(file_path, output_container))
        thread.start()
        thread.join(timeout=6)

        if thread.is_alive():
            return {"error": "Execution timed out"}
        return output_container