'use strict';

// The project must still typecheck and lint clean after the slice change —
// the two commands .build-kit/CLAUDE.md step 5 requires before a slice may be
// committed, enforced rather than trusted. `tsc -b --noEmit` instead of
// `npm run build` so no dist/ output is produced as a side effect of a commit.

const { execSync } = require('child_process');

const COMMANDS = [
  { label: 'tsc -b --noEmit', cmd: 'npx tsc -b --noEmit' },
  { label: 'oxlint', cmd: 'npx oxlint' },
];

module.exports = {
  name: 'build-lint',
  skipIfAlreadyFailing: true, // slow — don't bother once the commit is rejected already
  run(ctx) {
    for (const { label, cmd } of COMMANDS) {
      try {
        execSync(cmd, { cwd: ctx.repoRoot, stdio: 'pipe' });
      } catch (err) {
        const output = String(err.stdout || err.message || '').trim().split('\n').slice(0, 20).join('\n');
        return [{ path: `(${label})`, reason: `failed:\n${output}` }];
      }
    }
    return [];
  },
};
