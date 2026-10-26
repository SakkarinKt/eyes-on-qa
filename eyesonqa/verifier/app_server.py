"""Serve the built target app on 127.0.0.1 for a recording run."""

from __future__ import annotations

import os
import signal
import subprocess
import time
import urllib.error
import urllib.request
from contextlib import contextmanager
from pathlib import Path


def _wait_http(url: str, timeout_s: float) -> None:
    deadline = time.monotonic() + timeout_s
    last: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as r:  # noqa: S310 (local URL)
                if r.status < 500:
                    return
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
            last = e
        time.sleep(0.25)
    raise RuntimeError(f"app did not answer at {url} within {timeout_s}s: {last}")


@contextmanager
def preview_server(target_dir: str | Path, port: int = 4173, build: bool = True, timeout_s: float = 60.0):
    """Build (optionally) and serve target-app with `vite preview` bound to 127.0.0.1:<port>."""
    target_dir = Path(target_dir)
    if build or not (target_dir / "dist" / "index.html").exists():
        subprocess.run(
            ["npm", "run", "-s", "build"], cwd=target_dir, check=True, capture_output=True, text=True
        )
    proc = subprocess.Popen(
        ["npm", "run", "-s", "preview", "--", "--port", str(port), "--strictPort", "--host", "127.0.0.1"],
        cwd=target_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    base_url = f"http://127.0.0.1:{port}"
    try:
        _wait_http(base_url + "/", timeout_s)
        yield base_url
    finally:
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGKILL)
