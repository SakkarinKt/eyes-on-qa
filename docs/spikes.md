# Measurements

Numbers that size the budget and the verifier. Throwaway spike scripts live outside the repo.

## Recording and transcoding

**Planning measurement (Oct 20, before kickoff, disclosed here):** a 10.7 s 1280×800 Playwright clip of a static page was a 1.93 MB WebM; ffmpeg produced a 0.35 MB H.264 MP4 at 15 fps in 3.0 s.

**Day 1 (Oct 27), real flow with `eyesonqa record bench/criteria/add-task-flow.json`:**

| Measure | Value |
|---|---|
| Criteria recorded | 3 (phone viewport 390×844) |
| Wall time including app server start and transcoding | 12 s |
| Clip lengths | 2.9 s, 2.3 s, 2.4 s |
| MP4 size per clip | about 20 KB |
| DOM baseline | 10 assertions, all pass on clean Trackly |

Implications: clips are tiny for both the Files API and LINE; per-criterion recording costs seconds, so the benchmark's roughly 70 verifier runs are bounded by model time, not recording.

## Spike A — video judgment cost (pending credits)

Upload a clip via the Files API, judge with `muse-spark-1.3`, read `usage` → tokens per second of video and $ per judgment; repeat once on `muse-spark-1.3-contributor` to confirm video input works there. Gate: if a 10 s clip costs more than about $0.05 on the standard model, lower fps or resolution before sizing the benchmark.

## Spike B — SAM 3.1 output parsing (pending credits)

Run `sam-3.1` on a last frame with a concept such as "save button", parse the `<|box;x1=..;y1=..;x2=..;y2=..;w=..;h=..|>` records, draw the boxes, and confirm the coordinates map to pixels (boxes are in the source `w×h` frame).
