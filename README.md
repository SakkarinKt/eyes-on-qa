# Eyes-On QA

**A multi-agent coding team you run from your phone, which proves its work on video before anything merges.**

Entry for the [Meta Global AI Developer Hackathon 2026](https://cerebralvalley.ai/e/meta-ai-developer-hackathon), Indie Developer track, "Push the Frontier" theme. Built by Sakkarin ([@SakkarinKt](https://github.com/SakkarinKt)) with Claude as co-developer, tester, debugger, and advisor, during the building period Oct 27 – Nov 4, 2026.

## The problem

Coding agents can make every test pass while the app is visibly broken: a hidden button, an overlapping layout, a dead click, a toast drawn off-screen. Anyone running an autonomous agent loop ends up as the bottleneck, checking results on a laptop. Eyes-On QA moves that check into the loop: the agents record their acceptance flows on video, a Meta model watches the video and judges each criterion, SAM 3.1 marks the failing element, and the human approves or rejects from LINE on their phone.

## What it does

1. **LINE is the control plane.** Text a goal to a LINE bot. A signed, allowlisted webhook on a Mac starts a job and replies at once. The result comes back as a pass/fail clip, an annotated frame, and the PR link with approve/reject buttons. An explicit hold outranks the agent queue.
2. **Muse Wonder plans, Muse Spark 1.3 workers execute.** The planner turns a goal into tasks with acceptance criteria. Each worker runs in its own git worktree behind a default-deny policy gate, with a cost ledger and hard caps.
3. **A visual verifier.** Playwright runs every acceptance criterion with video, one clip per criterion with driver-measured step timestamps. Muse Spark's video understanding judges each clip pass/fail. On a fail, SAM 3.1 finds the named element ("the save button") and the frame is annotated.
4. **Governance.** One goal, one branch, one PR; never a push to `main`; approvals bound to the exact PR head; holds; an audit trail.

## What was built during the hackathon

Every file in this repository was written during the building period. Planning conversations (idea, interview, schedule) happened before kickoff; their artifacts were re-authored here from Oct 27 on. The git history is the timeline.

| Date (Taipei) | Component | Where |
|---|---|---|
| Oct 27 | Repository, Python package skeleton, CI, pre-push guard | `pyproject.toml`, `eyesonqa/cli.py`, `.github/workflows/ci.yml`, `scripts/hooks/` |
| Oct 27 | **Trackly**, the target app the agents work on: React + Vite + TypeScript, 5 screens, localStorage state, 10 unit tests | `target-app/` |
| Oct 27 | Acceptance-criteria schema (Pydantic), recording driver (one clip per criterion, H.264 MP4 + last frame), tests-plus-DOM baseline, `eyesonqa record` CLI | `eyesonqa/verifier/`, `bench/criteria/` |
| Oct 27 | Working policy, product governance spec, bug taxonomy, LINE and tunnel notes | `loop/`, `docs/` |

Rows are added as components land. The demo video shows only what is in this table.

## Status

Day 1 of 9. The verifier can record a goal's criteria against the built app and run the DOM baseline:

```bash
uv sync && (cd target-app && npm ci)
uv run eyesonqa record bench/criteria/add-task-flow.json
```

That builds Trackly, serves it on `127.0.0.1:4173`, records three criteria on a 390×844 phone viewport, writes `media/<run>/C*/clip.mp4`, `last_frame.png`, and `manifest.json`, and prints per-criterion driver and baseline results. The video judge, SAM overlay, LINE control plane, planner, and workers follow on the days below.

## Plan

| Day (Taipei) | Milestone |
|---|---|
| Oct 27 | Repo, Trackly, criteria schema, recording driver, DOM baseline |
| Oct 28 | Video judge (Muse Spark 1.3), SAM 3.1 overlay, cost ledger |
| Oct 29 | LINE webhook through a cloudflared tunnel, clip delivery, PR governance, approve/reject/hold |
| Oct 30 | Muse Spark worker loop with the policy gate; first goal end to end from the phone |
| Oct 31 | Muse Wonder planner, parallel workers, baseline harness |
| Nov 1 | Hardening; 30 seeded bugs; benchmark dry run |
| Nov 2 | Benchmark sweep (contributor mode) and clean runs; results |
| Nov 3 | Fixes, architecture diagram, README |
| Nov 4 | Demo video, submission |

## Evaluation

A benchmark of 30 seeded UI bugs that unit tests miss, in two strata (DOM-detectable and visual-only), scored against a tests-plus-DOM-assertions baseline on recall per stratum, false-alarm rate on clean runs, per-criterion false-pass rate, and cost per goal. Design in [`docs/bug-taxonomy.md`](docs/bug-taxonomy.md); numbers land on Nov 2.

## Repo map

| Path | What lives here |
|---|---|
| `eyesonqa/verifier/` | `criteria.py` (schema), `record.py` (driver, clips, DOM baseline), `app_server.py` (serves the built app) |
| `eyesonqa/control/`, `orchestrator/`, `planner/`, `workers/`, `governance/` | Land on the days above |
| `target-app/` | Trackly (`npm test`, `npm run build`) |
| `bench/criteria/` | Goal criteria files; `bench/bugs/` holds the seeded-bug patches from Nov 1 |
| `loop/HACKATHON.md` | How the human and Claude work together: roles, daily standup, ownership, spending, scope cuts |
| `docs/governance.md` | What Eyes-On QA enforces on its agents |
| `docs/bug-taxonomy.md`, `docs/line-facts.md`, `docs/spikes.md` | Benchmark design, LINE limits and tunnel notes, measurements |
| `.env.example` | Keys the runner needs; copy to `.env`, never commit |

## Models and APIs

Meta Model API (`https://api.meta.ai/v1`, OpenAI SDK drop-in): `muse-wonder-1.0` (planner), `muse-spark-1.3` (workers, video judge), `muse-spark-1.3-contributor` (benchmark sweep only), `sam-3.1` (failing-element overlay). LINE Messaging API for the control plane. Playwright, ffmpeg, and cloudflared on the Mac.

## Lineage

The agent governance reimplements patterns from the author's earlier public and private loops (a merge policy with hold labels, "an explicit hold outranks the queue", a default-deny tool gate with a hash-chained audit). No code is copied; the lineage column in `docs/governance.md` says where each idea came from.

## License

[MIT](LICENSE).
