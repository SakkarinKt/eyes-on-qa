"""Run a goal's acceptance criteria in Playwright, one video per criterion, and write a manifest.

Design: one browser context per criterion, so every criterion gets its own clip with step timestamps that the
driver measured (never the model). localStorage carries over between criteria through storage_state so a flow
can build on the previous criterion's state. After each clip: WebM -> H.264 MP4 (+faststart, 15 fps) for the
Meta Model API and LINE, plus the last frame as PNG for SAM 3.1.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

from playwright.sync_api import Browser, Page, sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeout

from .criteria import Criterion, DomAssertion, Goal, Step

STEP_TIMEOUT_MS = 5_000
ASSERT_TIMEOUT_MS = 2_000


@dataclass
class StepResult:
    index: int
    action: str
    t_start: float  # seconds since the criterion's recording started
    t_end: float
    ok: bool
    detail: str = ""


@dataclass
class AssertionResult:
    type: str
    testid: str | None
    ok: bool
    detail: str = ""


@dataclass
class CriterionRecord:
    id: str
    description: str
    expected_visible_outcome: str
    sam_concept: str
    viewport: dict
    webm: str
    mp4: str
    last_frame: str
    duration_s: float
    steps: list[StepResult] = field(default_factory=list)
    assertions: list[AssertionResult] = field(default_factory=list)
    driver_ok: bool = True
    baseline_pass: bool | None = None  # None when there are no DOM assertions


@dataclass
class Manifest:
    goal_id: str
    base_url: str
    started_at: float
    criteria: list[CriterionRecord] = field(default_factory=list)

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)


def _sel(testid: str) -> str:
    return f"[data-testid='{testid}']"


def _run_step(page: Page, base_url: str, step: Step) -> None:
    if step.action == "goto":
        page.goto(base_url + (step.path or "/"), wait_until="load", timeout=STEP_TIMEOUT_MS)
    elif step.action == "click":
        page.locator(_sel(step.testid or "")).first.click(timeout=STEP_TIMEOUT_MS)
    elif step.action == "fill":
        page.locator(_sel(step.testid or "")).first.fill(step.text or "", timeout=STEP_TIMEOUT_MS)
    elif step.action == "press":
        if step.testid:
            page.locator(_sel(step.testid)).first.press(step.key or "Enter", timeout=STEP_TIMEOUT_MS)
        else:
            page.keyboard.press(step.key or "Enter")
    elif step.action == "select":
        page.locator(_sel(step.testid or "")).first.select_option(step.value or "", timeout=STEP_TIMEOUT_MS)
    elif step.action == "wait":
        page.wait_for_timeout(step.ms or 0)
    elif step.action == "scroll":
        page.locator(_sel(step.testid or "")).first.scroll_into_view_if_needed(timeout=STEP_TIMEOUT_MS)
    elif step.action == "check":
        page.locator(_sel(step.testid or "")).first.check(timeout=STEP_TIMEOUT_MS)
    elif step.action == "uncheck":
        page.locator(_sel(step.testid or "")).first.uncheck(timeout=STEP_TIMEOUT_MS)
    else:  # pragma: no cover - schema forbids it
        raise ValueError(f"unknown step action {step.action}")


def _check(page: Page, a: DomAssertion) -> AssertionResult:
    """The tests-plus-DOM baseline.

    Visible means Playwright's notion: attached, non-empty box, not hidden by CSS.
    """
    try:
        if a.type == "visible":
            page.locator(_sel(a.testid or "")).first.wait_for(state="visible", timeout=ASSERT_TIMEOUT_MS)
            return AssertionResult(a.type, a.testid, True)
        if a.type == "hidden":
            page.locator(_sel(a.testid or "")).first.wait_for(state="hidden", timeout=ASSERT_TIMEOUT_MS)
            return AssertionResult(a.type, a.testid, True)
        if a.type == "text":
            loc = page.locator(_sel(a.testid or "")).first
            loc.wait_for(state="attached", timeout=ASSERT_TIMEOUT_MS)
            txt = loc.inner_text(timeout=ASSERT_TIMEOUT_MS).strip()
            ok = (a.equals is None or txt == a.equals) and (a.contains is None or a.contains in txt)
            return AssertionResult(a.type, a.testid, ok, f"text={txt!r}")
        if a.type == "url":
            url = page.url
            ok = (a.equals is None or url == a.equals) and (a.contains is None or a.contains in url)
            return AssertionResult(a.type, None, ok, f"url={url}")
        if a.type == "count":
            n = page.locator(_sel(a.testid or "")).count()
            return AssertionResult(a.type, a.testid, n == a.count, f"count={n}")
        if a.type == "checked":
            ok = page.locator(_sel(a.testid or "")).first.is_checked(timeout=ASSERT_TIMEOUT_MS)
            return AssertionResult(a.type, a.testid, ok, f"checked={ok}")
    except PlaywrightTimeout as e:
        return AssertionResult(a.type, a.testid, False, f"timeout: {str(e).splitlines()[0][:120]}")
    except Exception as e:  # noqa: BLE001 - a baseline failure must not abort the recording
        return AssertionResult(a.type, a.testid, False, f"{type(e).__name__}: {str(e)[:120]}")
    return AssertionResult(a.type, a.testid, False, "unhandled assertion type")


def transcode(webm: Path, mp4: Path, fps: int = 15) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(webm),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-r",
            str(fps),
            "-movflags",
            "+faststart",
            str(mp4),
        ],
        check=True,
    )


def last_frame(mp4: Path, png: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-sseof",
            "-0.5",
            "-i",
            str(mp4),
            "-frames:v",
            "1",
            "-update",
            "1",
            str(png),
        ],
        check=True,
    )


def probe_duration(mp4: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    try:
        return round(float(out), 3)
    except ValueError:
        return 0.0


def _record_criterion(
    browser: Browser, base_url: str, c: Criterion, out_dir: Path, storage_state: dict | None
) -> tuple[CriterionRecord, dict]:
    crit_dir = out_dir / c.id
    crit_dir.mkdir(parents=True, exist_ok=True)
    context = browser.new_context(
        viewport={"width": c.viewport.width, "height": c.viewport.height},
        record_video_dir=str(crit_dir),
        record_video_size={"width": c.viewport.width, "height": c.viewport.height},
        storage_state=storage_state,
    )
    page = context.new_page()
    t0 = time.monotonic()
    steps: list[StepResult] = []
    driver_ok = True
    for i, step in enumerate(c.steps):
        ts = time.monotonic() - t0
        try:
            _run_step(page, base_url, step)
            steps.append(StepResult(i, step.action, round(ts, 3), round(time.monotonic() - t0, 3), True))
        except Exception as e:  # noqa: BLE001 - keep the clip, mark the criterion
            steps.append(
                StepResult(
                    i,
                    step.action,
                    round(ts, 3),
                    round(time.monotonic() - t0, 3),
                    False,
                    f"{type(e).__name__}: {str(e).splitlines()[0][:160]}",
                )
            )
            driver_ok = False
            break
    page.wait_for_timeout(600)  # let the final frame settle
    assertions = [_check(page, a) for a in c.dom_assertions] if driver_ok else []
    new_state = context.storage_state()
    video = page.video
    context.close()  # finalizes the webm
    webm_path = Path(video.path()) if video else None
    mp4 = crit_dir / "clip.mp4"
    png = crit_dir / "last_frame.png"
    duration = 0.0
    if webm_path and webm_path.exists():
        transcode(webm_path, mp4)
        last_frame(mp4, png)
        duration = probe_duration(mp4)
    baseline = None if not c.dom_assertions else (driver_ok and all(a.ok for a in assertions))
    rec = CriterionRecord(
        id=c.id,
        description=c.description,
        expected_visible_outcome=c.expected_visible_outcome,
        sam_concept=c.sam_concept,
        viewport=c.viewport.model_dump(),
        webm=str(webm_path) if webm_path else "",
        mp4=str(mp4) if mp4.exists() else "",
        last_frame=str(png) if png.exists() else "",
        duration_s=duration,
        steps=steps,
        assertions=assertions,
        driver_ok=driver_ok,
        baseline_pass=baseline,
    )
    return rec, new_state


def record_goal(goal: Goal, base_url: str, out_dir: str | Path, headless: bool = True) -> Manifest:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is required on PATH")
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    manifest = Manifest(goal_id=goal.goal_id, base_url=base_url, started_at=time.time())
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        state: dict | None = None
        for c in goal.criteria:
            rec, state = _record_criterion(browser, base_url, c, out, state)
            manifest.criteria.append(rec)
        browser.close()
    (out / "manifest.json").write_text(manifest.to_json(), encoding="utf-8")
    return manifest


def summarize(m: Manifest) -> str:
    lines = [f"goal {m.goal_id} @ {m.base_url}"]
    for c in m.criteria:
        base = "n/a" if c.baseline_pass is None else ("pass" if c.baseline_pass else "FAIL")
        driver = "ok" if c.driver_ok else "ERROR"
        lines.append(f"  {c.id}: driver={driver} baseline={base} clip={c.duration_s}s {c.mp4}")
        for s in c.steps:
            if not s.ok:
                lines.append(f"      step {s.index} {s.action} failed: {s.detail}")
        for a in c.assertions:
            if not a.ok:
                lines.append(f"      assertion {a.type} {a.testid or ''} failed: {a.detail}")
    return "\n".join(lines)
