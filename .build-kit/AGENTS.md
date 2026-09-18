# Build Kit — Accumulated Learnings

- This project's `.eventmodelers/config.json` currently only has `agentIds.BUILD` — no
  `token`/`boardId`/`organizationId`. There is also no `.build-kit/.eventmodelers/config.json`.
  Per the ralph loop instructions, treat this as "config absent" and skip all board communication
  (screen HTML fetch, `update-slice-status`, comments) rather than running the `connect` skill's
  interactive setup mid-iteration.
- **`slice.json.screens[].pages` holds the screen markup — use it, never redesign.** The slicedata
  API omits `pages` (just as it omits `apiEndpoint`), so it is patched into `slice.json` by hand.
  Board access is therefore *not* required to follow the visual blueprint. Only if a screen entry
  has no `pages` key at all may you fall back to building from `fields` alone, matching sibling
  components in `src/slices/<context>/...` (Bulma `section`/`container`/`columns`/`field`/`control`
  classes, inline notification for errors — see `src/slices/day7/actor/blocktable/BlockTable.tsx`).
- Translate that markup structurally: every control in it must survive into the JSX (an
  `<input type="radio">` per row means the list needs real selection state, not a read-only table),
  column headers keep their names, and headings or subtitles absent from the markup are not invented.
- `slice.json.screens[].lane` gives the lane segment for the file path directly
  (`src/slices/<contextSlug>/<laneSlug>/<sliceFolder>/`) without needing a board outline call —
  useful when the board isn't reachable.
- `DateTime` typed fields with `YYYY-MM-DDTHH:mm` examples map cleanly to `<input type="datetime-local">`.
- When several slices' screens share one `title`, they belong on **one** page at
  `src/pages/<Title>.tsx`, per `.build-kit/CLAUDE.md` guideline 7 — not stacked as separate
  full-width `<section>`s in `App.tsx`. Each sharing slice's own `pages` markup shows that slice's
  portion of the shared screen; compose the page from the common parts and substitute each slice's
  component where its markup differs. `App.tsx` then renders the page, not the individual slices.
  (The Time Tracking "My shifts" screen is the worked example: MyShifts owns the shift table,
  ClockIn the Location/Terminal box beneath it.)
- A read model's Boolean `clockable`/held-style field maps well to a Bulma `tag is-success`/`is-light`
  pair (see `TableStatus.tsx`'s held/free tags) — but only when the screen markup actually shows a
  tag there. Check `pages` first: the "My shifts" markup wants a literal `Clock in opens` time with
  a `not yet` tag only for the unavailable rows, not a blanket status tag on every row.
- Branch new slice work from `main`, not an older per-day branch (`day8`/`day9`/...) — those
  branches can predate later merges from sibling slices, so branching from one risks losing code
  that's already on `main`.
- Not every `SPEC_ERROR` specification is client-side validation. Only validate inline what the
  command's own `fields[]` already carry (e.g. CreateShift's recurring/fromDay/toDay,
  start-before-end). When a rejection depends on state the component was never given — shift
  timing, assignment records, an existing open session — that's a backend invariant; let it surface
  through the standard `ApiError`/`onError` path instead of having the component fetch data just to
  replicate a check the backend already owns.
- `screens[].pages` markup implies state structurally, not just visually — an `<input
  type="radio">` per row means the component needs real selection state (e.g. a
  `selectedX`/`effectiveSelectedX` pair), not a read-only render of each row's own flag. Match the
  interaction pattern the markup shows, not just how it looks.
- Prefer deriving a "selected by default" value during render (state falling back to a computed
  default expression) over `setState` inside a `useEffect` for the same purpose — oxlint's
  `react(set-state-in-effect)` rule flags the latter as an unnecessary extra render, and the former
  is simpler besides.
- Vite only reads `.env` once at process startup — changing `VITE_MOCK_SAMPLE` (or any `VITE_*` var)
  requires restarting `npm run dev`, not just reloading the browser, for the new value to take
  effect during manual/Playwright verification.
- When composing a shared page (Step 6/5 of build-state-change/build-state-view) where one slice's
  component selects something (e.g. MyShifts' shift radio-select) and a sibling slice's component
  needs that selection (ClockIn's `shiftId` prop), thread it through the page, not a cross-slice
  import or a shared Context: give the upstream component an `onSelectionChange?: (id) => void`
  prop, have the page hold the resulting `useState` itself, and pass it down as the sibling's own
  prop. Each slice component still only knows its own declared props — the page is the only place
  that knows both exist. Also move each contributing slice's own page-level chrome (the shared
  `<h1>`/subtitle) up into the page component and have each slice's own component return just its
  fragment (table, box, etc.) — otherwise the composed page ends up with duplicate headings.
- A composed page can toggle between two whole slice-pairs, not just one component's inner view:
  ClockOut's mockup replaces MyShifts' picker+ClockIn box entirely with a notification+ClockOut box
  once the employee has an open session. Model that as one piece of state the page owns (e.g.
  `openSession`, set from the upstream command's `onSuccess`, cleared from the downstream command's
  own `onSuccess`) gating which pair of components renders — same "page owns cross-component
  coordination via callback props" pattern, just switching two whole fragments instead of one value.
- Not every string a screen's mockup shows for a command belongs to that command's own
  `command.fields[]`. A banner like "Clocked in on <shiftname> since <time>" reads as ClockOut
  screen content but is actually derived from a *different* command's outcome (ClockIn: which
  shift, what time) — never invent it as an extra prop on the component whose fields don't back it;
  it belongs in the page component alongside whatever other cross-component state that page already
  coordinates.
- **The commit-scope guard (`.build-kit/lib/check-commit-scope.cjs`, installed via
  `.githooks/pre-commit`) scopes exactly one slice folder per commit.** If a shared-page composition
  requires an actual signature change to an already-built sibling slice's own `.tsx` (not just
  wiring — e.g. widening a callback's payload shape), that change cannot ride in the same commit as
  the new slice's `feat:` commit even though `src/pages/<Screen>.tsx` itself is an allowed
  exception. Split into separate commits instead of `--no-verify`: board-metadata/progress.txt
  (touches no slice folder, passes trivially), the new slice's own `feat:` commit (its files +
  the page composition), and a `refactor:` commit for the sibling's signature change alone. Run
  `npm run run:checks` after staging each batch to confirm before committing.
- Before assuming a screen needs `src/pages/` composition, check whether its title is actually
  shared: `grep -l '"title": *"<ScreenTitle>"' .build-kit/.slices/*/index.json` should show the
  title appearing in more than this one slice's own definition. A context can have multiple
  screens that only look similar (e.g. "My shifts" vs. "My attendance" in Time Tracking) — a
  screen with no sibling slice on the same title stays a plain standalone component wired directly
  into `App.tsx`, same treatment as the very first slices before any page composition existed.
- When a read model field's `mapping` says a value is the same across every row (e.g. a
  pre-aggregated total like `monthHoursWorked`), read it off any single returned row instead of
  re-deriving or summing it client-side — the read model/backend already did that aggregation; the
  component's job is just to display it.
