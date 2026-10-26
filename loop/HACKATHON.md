# Hackathon working policy — human + Claude

How the human and Claude work together during a hackathon. Not what the product enforces (that is `docs/governance.md`). Copy this file to the next hackathon and change only the header and §7–§8.

## Header (this event)

| Field | Value |
|---|---|
| Event | Meta Global AI Developer Hackathon 2026 (Cerebral Valley + Meta), remote |
| Project | Eyes-On QA, Indie Developer track, Push the Frontier |
| Local time zone | Asia/Taipei (ET is local −12 h until Oct 31, −13 h from Nov 1) |
| Building period | Oct 27 – Nov 4 ET; kickoff was Tue 2026-10-27 00:00 local |
| Submission deadline | Wed Nov 4, 9:00 PM ET = Thu 2026-11-05 10:00 local, via the Cerebral Valley submit page; aim for the evening of Nov 4 |
| Judging | Stage 1 pass/fail (fits a theme, used Meta models). Stage 2 rubric 0–10: Impact 30 %, Use of Meta AI tooling 25 %, Technical depth & execution 20 %, Demo 25 %. Stage 3: top 5 per track, demos watched live Nov 9 12:00 PM ET. |
| Prizes | Indie: $150K / $100K / $75K / $50K / $25K. Bonus: Most Viral $20K (post the demo on X, submit the link), Best Build on Open Weight Models $10K, Community Vote $10K, Best Agentic Use-Case $5K, Best Creative Build $5K |
| Credits | $150 Meta Model API (claim form, batches, card required, set a $150 spend-limit notification). Partner credits are not guaranteed; budget $0. |
| Spend caps | Total $120; $3 per goal; benchmark sweep $15; video judgments $30. Enforced in the ledger before every paid call. |
| Standup records | Notion database [Eyes-On QA standups](https://app.notion.com/p/301ed41068c145ce85bbd3b28ad806d1) (private) |
| Sessions | Agents 101 Tue Oct 27 12:00 ET; Agents 102 "Best Practices for Verifiable Agents" Wed Oct 28 12:00 ET; office hours in Discord #office-hours 10–11 AM ET weekdays |

## 1. Purpose

Ship a working, demoable entry by the deadline without the two of us ever editing the same files, with every paid call inside a cap the code enforces, and with the "new work only" rule provable from the git history.

## 2. Roles

- **Human (product owner):** final say on scope; all accounts, cards, and spending; phone-side testing; demo recording; submission; anything that leaves the machine (posting, messaging organizers, applying for credits).
- **Claude (co-developer, tester, debugger, advisor):** builds, tests, and debugs the areas assigned each day; reviews the human's PRs; keeps the plan, ledger, and standup records current; raises risks early in one sentence.
- Either party writes code only in the areas assigned to them that day.

## 3. Daily standup

The first session of each day opens with a standup that Claude runs through `AskUserQuestion`, four questions in one call:

1. **Finished.** What each of us finished since the last standup, against that day's milestone. Answer yes / partial / no, with notes.
2. **Today.** Ownership per area, and which areas Claude may work on autonomously while the human is away. Areas: `target-app`, `bugs`, `verifier`, `line`, `agents`, `benchmark`, `docs`, `demo`.
3. **Blockers and decisions.** Anything stopping either of us, anything only the human can decide, anything the organizers changed.
4. **Spend.** Cumulative spend from the ledger against the caps; keep, slow, or pause paid calls.

Claude then writes one row to the Notion database and restates the day's split in one line. An evening wrap-up is optional and happens in chat.

## 4. Ownership and the no-overlap rule

- Ownership is decided at the standup, per area, and can change daily. Default for this event: the human takes `agents`; Claude takes precision work (`bugs`, `verifier`, `benchmark`) and pairs on the human's area on request. On Oct 27 the human assigned all areas to Claude while handling accounts.
- **One writer per top-level directory per day.** A mid-day swap is announced in chat first; the current owner pushes before handing over.
- Each party works on their own branch, `<owner>/<YYYY-MM-DD>-<slug>` (`sakkarin/…` or `claude/…`), and merges to `main` by PR with CI green, the same day, reviewed by the other party. The review is quick, not a gate.
- `main` is protected: PRs only, no force-push. `scripts/hooks/pre-push` refuses direct pushes to `main` (install with `sh scripts/install-hooks.sh`).

## 5. Autonomous Claude sessions

A session the human starts and walks away from stays inside the areas assigned at the standup, ends with a pushed branch and an open PR, reports in the Notion row, and never pushes to `main`. It stops and reports instead of guessing when a decision belongs to the human (scope, spending, accounts, anything external).

## 6. Spending

- No paid call until the pilot numbers are known (Spike A for video tokens). The forecast for any batch goes in the standup before the batch runs.
- The ledger records every call's usage and cost; caps are checked in code before each call; request ids are idempotent so a retry never double-spends.
- The human approves any cap increase in chat. Claude never creates accounts or enters payment details.

## 7. Scope-cut order (this event)

1. Second benchmark repeat
2. SAM masks (keep boxes)
3. Stretch governance rows (hash-chained audit, open-PR cap, revision round on reject, full stand-up template)
4. Muse Wonder planner (a single worker writes its own criteria)
5. Parallel workers

The demo hero (video verifier + SAM overlay) and the LINE path are never cut.

## 8. Submission checklist (this event)

- [ ] Repository public, README with the "built during the hackathon" table, architecture diagram, results, how to run
- [ ] 3-minute demo video showing only hackathon-built features; link accessible without login
- [ ] Submission form on the Cerebral Valley platform: repo, video link, every team member listed; one representative submits
- [ ] Meta models shown in use (Muse Spark video judgment, SAM 3.1, Muse Wonder planning)
- [ ] Demo posted on X and the post link submitted (Most Viral bonus); community-vote gallery entry checked
- [ ] License present; third-party licenses respected; no secrets in the repo (`.env` ignored)
- [ ] Demo rehearsed three times in a row without manual fixes; backup video ready
- [ ] Submitted before Thu 2026-11-05 10:00 local (aim: evening of Nov 4); Nov 3 is the last day for submission questions in Discord

## 9. Rules applied (from the participant guide, read Oct 27)

- New work only, built Oct 27 – Nov 4; the demo shows only hackathon-built features and judges must be able to tell. Planning artifacts from before kickoff were re-authored inside the repo during the event, and the README says so.
- Patterns from our own earlier repos may be reimplemented; no code is copied.
- Solo entry, Indie track; public repository; 3-minute demo video required.
- Eyes-On QA is outside the anti-project list (medical, RAG, image analyzers, education chatbots, job screeners, nutrition, personality, sports, political).

## 10. Reuse instructions

For the next hackathon: copy this file, replace the header table, rewrite §7–§9, keep §1–§6. Create a fresh Notion standup database with the same columns (Name, Date, Day, Done ×2, Today ×2, Areas ×2, Blockers, Decisions, Spend USD, Plan met).
