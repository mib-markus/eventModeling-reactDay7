'use strict';

// A slice commit that adds/changes a component must also ship at least one
// samples/sample-<N>.json. This is the UI stack's counterpart to a backend's
// test-file-present check: guideline 9 requires every component be exercisable
// with no backend running, and samples are the only mechanism for that here
// (VITE_DATA_MODE=mock serves reads from them). A component with no samples is
// untestable in isolation, which is the thing the guideline exists to prevent.

const { execSync } = require('child_process');

const COMPONENT_FILE = /^src\/slices\/([^/]+)\/([^/]+)\/([^/]+)\/[A-Za-z0-9]+\.tsx$/;

module.exports = {
  name: 'samples-present',
  run(ctx) {
    const sliceDirs = new Set();
    for (const { path: p } of ctx.changes) {
      const m = COMPONENT_FILE.exec(p);
      if (m) sliceDirs.add(`src/slices/${m[1]}/${m[2]}/${m[3]}`);
    }
    if (sliceDirs.size === 0) return [];

    let tracked = [];
    try {
      tracked = execSync('git ls-files -- src/slices', { cwd: ctx.repoRoot, encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
    } catch {
      // best-effort — fall through with whatever's staged
    }
    const known = new Set([...tracked, ...ctx.changes.map((c) => c.path)]);

    const violations = [];
    for (const dir of sliceDirs) {
      const hasSample = [...known].some((f) => f.startsWith(`${dir}/samples/sample-`) && f.endsWith('.json'));
      if (!hasSample) {
        violations.push({
          path: dir,
          reason: 'no samples/sample-<N>.json found for this slice — every component must be exercisable in mock mode',
        });
      }
    }
    return violations;
  },
};
