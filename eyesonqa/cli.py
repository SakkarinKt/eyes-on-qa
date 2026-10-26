"""Command-line entry point. Subcommands grow with the build; today only `selfcheck` exists."""

from __future__ import annotations

import argparse
import sys


def selfcheck() -> int:
    """Offline, keyless check that the package imports and the toolchain is present."""
    import shutil

    problems = []
    for tool in ("ffmpeg", "ffprobe", "git", "gh", "cloudflared"):
        if shutil.which(tool) is None:
            problems.append(f"missing tool on PATH: {tool}")
    try:
        import playwright  # noqa: F401
    except ImportError as e:  # pragma: no cover
        problems.append(f"playwright import failed: {e}")
    for p in problems:
        print(f"FAIL {p}")
    print(f"EYESONQA selfcheck: {'PASS' if not problems else 'FAIL'} ({5 - len(problems)}/5 tools)")
    return 0 if not problems else 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="eyesonqa")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("selfcheck", help="offline toolchain check")
    rec = sub.add_parser("record", help="record a goal's acceptance criteria as per-criterion clips")
    rec.add_argument("criteria", help="path to a criteria JSON file (see bench/criteria/)")
    rec.add_argument("--out", default=None, help="output dir (default media/<goal_id>-<timestamp>)")
    rec.add_argument("--base-url", default=None, help="use a running app instead of serving target-app")
    rec.add_argument("--target-dir", default="target-app")
    rec.add_argument("--port", type=int, default=4173)
    rec.add_argument("--no-build", action="store_true", help="serve the existing dist/ without rebuilding")
    rec.add_argument("--headed", action="store_true")
    args = ap.parse_args(argv)
    if args.cmd == "selfcheck":
        return selfcheck()
    if args.cmd == "record":
        return record(args)
    return 2


def record(args: argparse.Namespace) -> int:
    import time
    from pathlib import Path

    from eyesonqa.verifier.app_server import preview_server
    from eyesonqa.verifier.criteria import load_goal
    from eyesonqa.verifier.record import record_goal, summarize

    goal = load_goal(args.criteria)
    out = Path(args.out) if args.out else Path("media") / f"{goal.goal_id}-{time.strftime('%Y%m%d-%H%M%S')}"
    if args.base_url:
        manifest = record_goal(goal, args.base_url, out, headless=not args.headed)
    else:
        with preview_server(args.target_dir, port=args.port, build=not args.no_build) as base_url:
            manifest = record_goal(goal, base_url, out, headless=not args.headed)
    print(summarize(manifest))
    print(f"manifest: {out / 'manifest.json'}")
    return 0 if all(c.driver_ok for c in manifest.criteria) else 1


if __name__ == "__main__":
    sys.exit(main())
