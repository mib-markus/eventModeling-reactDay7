'use strict';

// Rejects a slice commit that touches shared infra which must never change from
// slice work: the package manifest/lockfiles (no new/changed dependencies), and
// the shared API client + Supabase singleton. Per .build-kit/CLAUDE.md guideline
// 3, headers/fetch/table access live exclusively in src/lib/api.ts and a slice
// only ever *calls* postCommand/queryReadModel — so a slice commit that rewrites
// either of those is reaching outside its own boundary.

const BLOCKED = [
  {
    pattern: /^(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|npm-shrinkwrap\.json)$/,
    reason: 'dependency/package manifest changes are not allowed from a slice commit',
  },
  {
    pattern: /^src\/lib\/(api|supabase)\.ts$/,
    reason: 'shared API client/Supabase singleton — a slice calls postCommand/queryReadModel, never rewrites them',
  },
  {
    pattern: /^src\/main\.tsx$/,
    reason: 'app entry point is shared infra — never touched by slice work',
  },
];

module.exports = {
  name: 'blocked-paths',
  run(ctx) {
    const violations = [];
    for (const { path: p } of ctx.changes) {
      const hit = BLOCKED.find((b) => b.pattern.test(p));
      if (hit) violations.push({ path: p, reason: hit.reason });
    }
    return violations;
  },
};
