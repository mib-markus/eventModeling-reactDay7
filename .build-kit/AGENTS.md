# Build Kit — Accumulated Learnings

- This project's `.eventmodelers/config.json` currently only has `agentIds.BUILD` — no
  `token`/`boardId`/`organizationId`. There is also no `.build-kit/.eventmodelers/config.json`.
  Per the ralph loop instructions, treat this as "config absent" and skip all board communication
  (screen HTML fetch, `update-slice-status`, comments) rather than running the `connect` skill's
  interactive setup mid-iteration.
- When a screen node can't be fetched (no board access), fall back to building the form from
  `slice.json` fields alone, matching the visual/markup conventions already used by sibling
  components in `src/slices/<context>/...` (Bulma `section`/`container`/`columns`/`field`/`control`
  classes, inline notification for errors — see `src/slices/day7/actor/blocktable/BlockTable.tsx`).
- `slice.json.screens[].lane` gives the lane segment for the file path directly
  (`src/slices/<contextSlug>/<laneSlug>/<sliceFolder>/`) without needing a board outline call —
  useful when the board isn't reachable.
- `DateTime` typed fields with `YYYY-MM-DDTHH:mm` examples map cleanly to `<input type="datetime-local">`.
- When several slices' screens share one `title` (build-state-change/build-state-view's page
  composition step) but the board isn't reachable, don't guess at `src/pages/<Title>.tsx` markup —
  build each slice's component standalone from its own `slice.json` and wire it into `App.tsx`
  directly, same as every other slice so far. Revisit page composition once board access exists.
- A read model's Boolean `clockable`/held-style field maps well to a Bulma `tag is-success`/`is-light`
  pair (see `TableStatus.tsx`'s held/free tags and `MyShifts.tsx`'s clockable tag).
- Branch new slice work from `main`, not an older per-day branch (`day8`/`day9`/...) — those
  branches can predate later merges from sibling slices, so branching from one risks losing code
  that's already on `main`.
- Not every `SPEC_ERROR` specification is client-side validation. Only validate inline what the
  command's own `fields[]` already carry (e.g. CreateShift's recurring/fromDay/toDay,
  start-before-end). When a rejection depends on state the component was never given — shift
  timing, assignment records, an existing open session — that's a backend invariant; let it surface
  through the standard `ApiError`/`onError` path instead of having the component fetch data just to
  replicate a check the backend already owns.
