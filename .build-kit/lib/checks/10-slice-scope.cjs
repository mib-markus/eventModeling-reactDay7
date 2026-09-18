'use strict';

// Everything staged in a slice commit must be inside the slice's own folder, or
// one of the documented shared-infra exceptions a slice legitimately registers
// *into* (never rewrites wholesale). See .build-kit/CLAUDE.md guidelines 6 and 7.
//
// The exceptions here are the two places allowed to know a slice exists: the page
// that composes it (src/pages/<ScreenTitle>.tsx, guideline 7 — the only file
// permitted to import from more than one slice folder) and the app shell that
// renders that page.

const ALLOWED_EXCEPTIONS = [
  /^src\/pages\/[A-Za-z0-9]+\.tsx$/, // shared-screen page composition (guideline 7)
  /^src\/App\.tsx$/, // app shell — renders pages/top-level slice components
];

// Captures the {context}/{lane}/{slice} segment so files from two different
// slices in one commit can be told apart — SLICE_PATTERN alone only proves a
// path is *inside some* slice folder, not which one. Three segments, not two:
// the actor lane is a path segment in this stack (guideline 8).
const SLICE_KEY_PATTERN = /^src\/slices\/([^/]+\/[^/]+\/[^/]+)\//;

module.exports = {
  name: 'slice-scope',
  run(ctx) {
    const violations = [];

    const sliceKeys = new Set();
    for (const { path: p } of ctx.changes) {
      const m = p.match(SLICE_KEY_PATTERN);
      if (m) sliceKeys.add(m[1]);
    }
    const primarySlice = [...sliceKeys].sort()[0] || null;

    for (const { path: p } of ctx.changes) {
      if (ALLOWED_EXCEPTIONS.some((r) => r.test(p))) continue;

      const m = p.match(SLICE_KEY_PATTERN);
      if (!m) {
        violations.push({
          path: p,
          reason: 'outside src/slices/{context}/{lane}/{slice}/ and not a documented exception',
        });
        continue;
      }
      if (m[1] !== primarySlice) {
        violations.push({
          path: p,
          reason: `touches slice "${m[1]}" but this commit's scope is "${primarySlice}" — split into separate commits`,
        });
      }
    }
    return violations;
  },
};
