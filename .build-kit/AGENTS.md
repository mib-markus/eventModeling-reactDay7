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
