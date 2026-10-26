# Product governance — what Eyes-On QA enforces on its agents

Written Oct 27, 2026. The "lineage" column names which of the author's earlier loops inspired a rule; the patterns are reimplemented here, no code is copied.

| Rule | How it lands | Lineage |
|---|---|---|
| Output is a PR, never a push to `main`; one goal = one branch = one PR | Branch `goal/<date>-<slug>`; task worktrees merge into the goal branch; `gh pr create` to `main`. `scripts/hooks/pre-push` and the runner's git wrapper both refuse `main`. | `our-ai-startup-team/loop/GOAL.md` invariants; `janus-chrysalis/loop/GOAL.md` |
| Approve / reject from LINE buttons, approval bound to the exact PR head | Postback data `approve:<job>:<head_sha>`; the orchestrator merges only if the PR head still equals that SHA and CI is green. Reject closes the PR and deletes the branch. | `our-ai-startup-team/tools/loop_merge.py` (`ceo-approved`, `ceo-hold`); `claude-cloud-playground` `agentd/gate.py` single-use approvals keyed by call hash |
| An explicit human hold outranks the queue | `hold` pauses dispatch and merges; `hold <job>` parks one job; `resume` clears. A held job is never acted on in the current cycle; acting on it later is reported. | `janus-chrysalis/loop/GOAL.md` amendment 2026-08-29 |
| Policy gate in code, default deny, every write path through it | Every worker tool call passes one `Gate.decide` with a rule table: paths inside the worktree only; `run_cmd` from an allowlist (`npm test`, `npm run build`, `npx vitest`, `git status`, `git diff`); secret-shaped strings denied; network denied. Rule ids go into the audit. | `agentd/gate.py`, `agentd/tools.py`; lessons *enforce-in-code-not-in-the-prompt*, *every-write-path-through-the-gate* |
| Hash-chained audit per job *(stretch)* | `audit.jsonl` per job: decisions, executions, verifier verdicts, approvals; `verify()` in the test suite. | `agentd/gate.py` `Audit` |
| Forecast before paid calls; ledger check before each call; idempotent request ids | Cost ledger in SQLite; per-goal and total caps checked before every API call; Spike A as the pilot; request ids from job+task+turn. | lesson *forecast-before-paid-calls* |
| Model claims are not evidence | The PR body carries verifier verdicts from the video judge with clip and frame links, never the worker's own "done" claim. Safety (gate held) and capability (goal achieved) are scored separately. | lesson *model-claims-are-not-tool-results*; `agentd/loop.py` |
| Stand-up report as the PR body | MVP sections: Done, Verified (per-criterion pass/fail with timestamps), Cost. Stretch: Learned, Blockers, Decisions needed, Assumptions made, Runtime. | `loop/GOAL.md` §5 |
| Open-PR cap and bounded increments *(cap is stretch)* | At most 2 goal PRs awaiting approval; further goals queue with a LINE reply saying so. Per-task caps on turns, tokens, wall-clock. | `loop/GOAL.md` §7 safety valves |
| Feedback first *(stretch)* | A `reject` with a comment re-dispatches one worker on the same branch (one revision round), never a second PR. | `loop/WORKER.md` |
| Heartbeat, no spam | `status` replies (free) summarize queue, holds, spend. Pushes limited to job start and job result. | `loop/GOAL.md` §8 |

**MVP** (Oct 29–30): PR-only output with branch protection and the pre-push hook, SHA-bound approve/reject, hold/resume, the policy gate with command allowlist and worktree jail, the cost ledger, model claims are not evidence, heartbeat.
**Stretch** (cut first if behind): hash-chained audit, open-PR cap, the revision round on reject, the full stand-up template.

## Job state machine

`queued → planning → working → verifying → awaiting_approval → merged | rejected`, with `held` as an overlay flag on any state and a global HOLD that stops dispatch. Every transition is written to the job row and, in the stretch version, to the audit chain.

## LINE command grammar (MVP)

| Message | Effect |
|---|---|
| `goal: <text>` | Create a job; reply with the job id and queue position |
| `status` | Reply with queue, holds, open PRs, cumulative spend |
| `hold` / `hold <job>` / `resume` | Global or per-job hold; resume |
| postback `approve:<job>:<sha>` | Squash-merge the PR if its head still equals `<sha>` and CI is green |
| postback `reject:<job>:<sha>` | Close the PR, delete the branch |

Only the owner's LINE `userId` is accepted; every other sender gets no reply.

## What exists today (Oct 27)

The pre-push guard (`scripts/hooks/pre-push`) and the recording driver's DOM baseline (`eyesonqa/verifier/record.py`). The orchestrator, gate, ledger, and LINE handlers land Oct 29–30.
