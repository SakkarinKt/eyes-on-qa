# Trackly and the 30 seeded UI bugs

Written Oct 27, 2026 against the Trackly app in `target-app/`. The bug patches themselves are written from Nov 1.

## Trackly, the target app

A client-only task tracker: React + Vite + TypeScript, state in `localStorage` (`src/lib/store.ts`), 10 Vitest unit tests. Routes and stable `data-testid`s:

| Route | Screen | `data-testid`s |
|---|---|---|
| `/login` | Sign in (display name only) | `login-form`, `login-name`, `login-submit` |
| `/tasks` | Task list | `add-task-button`, `search-input`, `filter-select`, `done-counter`, `task-list`, `task-row`, `task-checkbox`, `task-title`, `priority-icon`, `due-badge`, `empty-state`, `no-match`, `toast` |
| `/tasks/new` | New task form | `new-task-form`, `title-input`, `priority-select`, `due-input`, `notes-input`, `save-button`, `cancel-button`, `form-error` |
| `/tasks/:id` | Task detail | `back-button`, `edit-button`, `delete-button`, `detail-title`, `priority-icon`, `priority-label`, `due-badge`, `detail-notes`, `progress-input`, `progress-bar`, `detail-done`, `edit-dialog`, `dialog-close`, `edit-title-input`, `edit-priority`, `edit-notes`, `edit-save`, `edit-cancel` |
| `/settings` | Settings | `avatar`, `profile-name`, `profile-stats`, `settings-form`, `name-input`, `theme-toggle`, `help-link`, `settings-save`, `reset-button` |
| header | Navigation | `brand`, `nav-tasks`, `nav-new`, `nav-settings`, `who` |

Viewports used by the verifier: desktop 1280×800 and phone 390×844.

## Strata

- **D (DOM-detectable, 14 bugs):** Playwright's actionability checks, `visible`/`hidden`, a timed-out click, a URL or text assertion catches these. The baseline is expected to score here.
- **V (visual-only, 16 bugs):** the DOM is correct, every assertion passes, and the bug is only visible when you look. This stratum is the headline.

Each bug is one patch file `bench/bugs/<id>.patch` against clean Trackly, plus `bench/bugs/<id>.criteria.json`. The harness applies the patch in a fresh worktree, runs the baseline and the verifier, and records which caught the bug.

## The 30 bugs

| Id | Stratum | Screen | Bug | Seeded how | Expected to catch it |
|---|---|---|---|---|---|
| D01 | D | tasks | Add task button hidden on phones | `display:none` under `max-width: 480px` | baseline: `visible` fails at 390 px |
| D02 | D | new | Save button invisible | `opacity: 0` | baseline: `visible` fails |
| D03 | D | new | Save button covered by a transparent overlay | full-size `div` with higher `z-index` | baseline: click times out (intercepted) |
| D04 | D | detail | Delete button ignores clicks | `pointer-events: none` | baseline: click times out |
| D05 | D | tasks | Checkbox cannot be toggled | `disabled` attribute | baseline: `check` fails |
| D06 | D | new | Save does nothing | `onSubmit` not bound | baseline: URL and count assertions fail |
| D07 | D | nav | Settings link goes to `/tasks` | wrong `to` prop | baseline: URL assertion fails |
| D08 | D | detail | Back goes to `/login` | wrong navigate target | baseline: URL assertion fails |
| D09 | D | tasks | Filter lacks the "Done" option | option removed | baseline: `select` fails |
| D10 | D | new | Title input accepts one character | `maxLength={1}` | baseline: text assertion fails |
| D11 | D | tasks | Search does not filter | `onChange` removed | baseline: count assertion fails |
| D12 | D | detail | Edit dialog has no close button | `dialog-close` removed | baseline: locator not found |
| D13 | D | new | Enter no longer submits | `<form>` replaced by `<div>` | baseline: URL assertion fails |
| D14 | D | settings | Help link is dead | `href="#"` | baseline: URL assertion fails |
| V01 | V | tasks | Title and due badge overlap on phones | absolute positioning, no wrap | verifier only |
| V02 | V | tasks | Long titles cut mid-word, badge clipped | `overflow:hidden`, fixed width, no ellipsis | verifier only |
| V03 | V | tasks | Last row clipped out of view | list `max-height` + `overflow:hidden` | verifier only (`visible` passes: non-empty box) |
| V04 | V | tasks | "Task saved" toast drawn off-screen | `bottom: -100px` | verifier only |
| V05 | V | tasks | Corner spinner never stops | `isLoading` never cleared; non-blocking icon | verifier only |
| V06 | V | tasks | Done counter same color as background | `color` equals `background` | verifier only (text assertion passes) |
| V07 | V | new | Save label unreadable | contrast 1.2:1 | verifier only |
| V08 | V | detail | "High" priority shows the low glyph | wrong glyph, correct `aria-label` | verifier only |
| V09 | V | tasks | Checked state not drawn | `.check input:checked + .check-box` rule removed, `aria-checked` correct | verifier only |
| V10 | V | settings | Labels overlap their inputs on phones | grid template broken | verifier only |
| V11 | V | detail | Sticky header covers the dialog title | `z-index` order | verifier only (dialog still clickable) |
| V12 | V | new | Save button below the fold on phones, no scroll cue | tall spacer pushes the actions row past 844 px | verifier only (Playwright auto-scrolls) |
| V13 | V | detail | Dark theme: dark text on dark background | theme token wrong | verifier only |
| V14 | V | settings | Avatar stretched | `object-fit` removed, non-square size | verifier only |
| V15 | V | tasks | Empty-state glyph overlaps its text | negative margin | verifier only |
| V16 | V | detail | Progress bar drawn at 0 % though value is 60 % | fill width ignores value, `aria-valuenow` correct | verifier only |

D06 and D13 are the pitch's "dead click" bugs. They are DOM-detectable only because the criterion asserts a post-submit state; the harness records which assertion caught each bug.

## Acceptance-criteria schema

Implemented in `eyesonqa/verifier/criteria.py` (Pydantic). One file per goal; `bench/criteria/add-task-flow.json` is the first.

```json
{
  "goal_id": "add-task-flow",
  "app": "target-app",
  "criteria": [
    {
      "id": "C1",
      "description": "On a 390px-wide phone viewport the Add task button is visible and tapping it opens the form",
      "viewport": { "width": 390, "height": 844 },
      "steps": [
        { "action": "goto", "path": "/tasks" },
        { "action": "click", "testid": "add-task-button" },
        { "action": "wait", "ms": 600 }
      ],
      "expected_visible_outcome": "A visible Add task button; after the tap, a form titled New task with a Title field and a Save button",
      "sam_concept": "add task button",
      "dom_assertions": [
        { "type": "url", "contains": "/tasks/new" },
        { "type": "visible", "testid": "new-task-form" }
      ]
    }
  ]
}
```

Steps: `goto {path}`, `click {testid}`, `fill {testid, text}`, `press {key, testid?}`, `select {testid, value}`, `wait {ms}`, `scroll {testid}`, `check {testid}`, `uncheck {testid}`. DOM assertions (the baseline): `visible`, `hidden`, `text {testid, equals|contains}`, `url {equals|contains}`, `count {testid, count}`, `checked {testid}`.

The driver records each criterion in its own browser context (its own clip), carries `localStorage` forward through storage state, stamps every step's start and end from its own clock, transcodes to H.264 MP4, and keeps the last frame for SAM. The judge sees one clip and one `expected_visible_outcome` at a time.

## Metrics

- Recall per stratum and overall on the 30 seeded bugs
- False-alarm rate on 10 clean (no bug) runs
- Per-criterion false-pass rate on buggy runs
- Cost per goal (ledger) and wall-clock per goal
