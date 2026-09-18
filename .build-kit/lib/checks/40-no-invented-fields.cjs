'use strict';

// Heuristic: flags a field name declared in a slice component's data interface
// that doesn't appear anywhere in that slice's own slice.json. Not a real
// TS-aware check (no parser dependency) — it regex-extracts fields from
// `interface X { ... }` / `type X = { ... }` literals, so unusual formatting
// (nested object/array field types) can slip past undetected. It only adds
// violations for fields it is confident about; when slice.json can't be
// found/parsed for a slice, that slice's files are skipped rather than guessed at.
//
// `*Props` interfaces are deliberately excluded: a component's props are its
// wiring contract with the page that renders it (an `onSelectionChange` callback,
// an `at` evaluation moment), not the command/read-model payload slice.json
// describes. Field invention is only meaningful in the data shapes.

const fs = require('fs');
const path = require('path');
const { findSliceJson, normalize } = require('../util/find-slice.cjs');

const COMMON_ALLOWED = new Set(
  ['id', 'userId', 'correlationId', 'causationId', 'type', 'data', 'metadata', 'createdAt', 'updatedAt', 'timestamp', 'ok', 'error'].map(normalize),
);

// Data-shape declarations only — `interface FooProps`/`type FooProps` are skipped
// by the negative lookahead on the name.
const TYPE_LITERALS = [
  /(?:export\s+)?interface\s+(?!\w*Props\b)[A-Za-z0-9_]+\s*{([^}]*)}/g,
  /(?:export\s+)?type\s+(?!\w*Props\b)[A-Za-z0-9_]+\s*=\s*{([^}]*)}/g,
];

const FIELD_LINE = /^\s*([A-Za-z_][A-Za-z0-9_]*)\??\s*:/gm;

function collectDeclaredFields(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) collectDeclaredFields(item, out);
  } else if (node && typeof node === 'object') {
    if (typeof node.name === 'string' && ('type' in node || 'optional' in node)) {
      out.add(normalize(node.name));
    }
    for (const key of Object.keys(node)) collectDeclaredFields(node[key], out);
  }
}

module.exports = {
  name: 'no-invented-fields',
  run(ctx) {
    const bySlice = new Map(); // "context/lane/SliceName" -> { context, sliceName, files: [] }

    for (const { path: p } of ctx.changes) {
      if (!p.endsWith('.tsx') && !p.endsWith('.ts')) continue;
      const m = /^src\/slices\/([^/]+)\/([^/]+)\/([^/]+)\//.exec(p);
      if (!m) continue;
      // findSliceJson resolves against .build-kit/.slices/<context>/<slice>/,
      // which has no lane level — so the lane segment (m[2]) is deliberately
      // not part of the lookup, only of the grouping key.
      const key = `${m[1]}/${m[2]}/${m[3]}`;
      if (!bySlice.has(key)) bySlice.set(key, { context: m[1], sliceName: m[3], files: [] });
      bySlice.get(key).files.push(p);
    }

    const violations = [];

    for (const { context, sliceName, files } of bySlice.values()) {
      const slice = findSliceJson(ctx.repoRoot, context, sliceName);
      if (!slice) continue; // can't verify — don't block

      const declared = new Set();
      collectDeclaredFields(slice, declared);
      if (declared.size === 0) continue; // slice.json shape not recognized — don't block

      for (const file of files) {
        let content;
        try {
          content = fs.readFileSync(path.join(ctx.repoRoot, file), 'utf8');
        } catch {
          continue; // deleted/unreadable — nothing to check
        }

        for (const pattern of TYPE_LITERALS) {
          pattern.lastIndex = 0;
          let typeMatch;
          while ((typeMatch = pattern.exec(content))) {
            FIELD_LINE.lastIndex = 0;
            let fieldMatch;
            while ((fieldMatch = FIELD_LINE.exec(typeMatch[1]))) {
              const raw = fieldMatch[1];
              const norm = normalize(raw);
              if (COMMON_ALLOWED.has(norm) || declared.has(norm)) continue;
              violations.push({
                path: file,
                reason: `field "${raw}" is not declared anywhere in slice.json for this slice — check for an invented field`,
              });
            }
          }
        }
      }
    }

    return violations;
  },
};
