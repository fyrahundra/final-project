import json
import sys
import urllib.error
import urllib.request

BASE_URL = "http://localhost:8000"
RUN_URL = f"{BASE_URL}/run"


def run_snippet(code: str) -> tuple[int, dict]:
    payload = json.dumps({"code": code}).encode("utf-8")
    request = urllib.request.Request(
        RUN_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        return exc.code, json.loads(body)


def assert_network_blocked_with_socket() -> None:
    status, body = run_snippet(
        "import socket\n"
        "socket.create_connection(('example.com', 80), 2)\n"
    )
    assert status == 403, f"socket expected 403, got {status} with body {body}"
    assert body.get("error_code") == "network_disabled", (
        f"socket expected error_code=network_disabled, got {body}"
    )


def assert_network_blocked_with_urllib() -> None:
    status, body = run_snippet(
        "import urllib.request\n"
        "urllib.request.urlopen('https://example.com', timeout=2)\n"
    )
    assert status == 403, f"urllib expected 403, got {status} with body {body}"
    assert body.get("error_code") == "network_disabled", (
        f"urllib expected error_code=network_disabled, got {body}"
    )


def assert_process_noise_is_truncated() -> None:
    status, body = run_snippet(
        "import os\n"
        "import sys\n"
        "for _ in range(2000):\n"
        "    try:\n"
        "        pid = os.fork()\n"
        "        if pid == 0:\n"
        "            os._exit(0)\n"
        "    except Exception as e:\n"
        "        sys.stderr.write((str(e) + '\\n') * 2000)\n"
        "        break\n"
    )
    assert status in (403, 408), f"process-noise expected 403/408, got {status} with body {body}"
    stderr = str(body.get("stderr", ""))
    stderr_original_length = int(body.get("stderr_original_length", len(stderr)))
    assert stderr_original_length >= len(stderr), "stderr_original_length must be >= stderr length"
    if stderr_original_length > len(stderr):
        assert stderr.endswith("...truncated..."), (
            f"expected truncation marker, got tail={stderr[-40:]}"
        )
        assert body.get("stderr_truncated") is True, f"expected stderr_truncated true, got {body}"


def main() -> int:
    assert_network_blocked_with_socket()
    assert_network_blocked_with_urllib()
    assert_process_noise_is_truncated()
    print("Policy regression tests passed")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"Policy regression tests failed: {exc}")
        raise SystemExit(1)
