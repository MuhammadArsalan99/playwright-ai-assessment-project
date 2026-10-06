#!/usr/bin/env node
// Enforces the mechanical rules from AGENTS.md so they do not depend on anyone remembering them.
// Run: npm run audit      (also runs in CI before the tests)
//
// A finding can be silenced on one line with a trailing comment that gives the reason:
//   await row.locator('a.btn-danger').click(); // audit-ignore: no data-test and no accessible name
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['tests', 'pages', 'fixtures', 'utils'];
const IGNORE_MARK = 'audit-ignore';

const RULES = [
  {
    id: 'no-sleep',
    re: /waitForTimeout\s*\(/,
    scope: SOURCE_DIRS,
    why: 'fixed sleeps are flaky; use a web-first assertion or expect.poll',
  },
  {
    id: 'no-test-only',
    re: /\b(?:test|describe)\.only\s*\(/,
    scope: ['tests'],
    why: '.only silently skips the rest of the suite',
  },
  {
    id: 'no-debug-output',
    re: /console\.log\s*\(/,
    scope: SOURCE_DIRS,
    why: 'leftover debug output',
  },
  {
    id: 'no-xpath',
    re: /xpath=|locator\(\s*['"`]\/\//,
    scope: SOURCE_DIRS,
    why: 'XPath locators are brittle',
  },
  {
    id: 'no-nth-child',
    re: /nth-child/,
    scope: SOURCE_DIRS,
    why: 'position-based CSS is brittle',
  },
  {
    id: 'no-positional-pick',
    re: /\.(?:nth|first|last)\s*\(/,
    scope: ['tests'],
    why: 'pick products by name after checking stock (catalogPage.pickInStock), not by position',
  },
  {
    id: 'no-raw-locator-in-tests',
    re: /\bpage\.locator\s*\(/,
    scope: ['tests'],
    why: 'locators belong in page objects',
  },
  {
    id: 'no-hardcoded-money',
    re: /['"`]-?\$\s?\d[\d,]*\.\d{2}['"`]/,
    scope: ['tests'],
    skip: ['tests/unit'],
    why: 'read amounts from the page; never hard-code them',
  },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith('.js') ? [full] : [];
  });
}

const isCommentLine = (line) => /^\s*(\/\/|\/\*|\*)/.test(line);

const findings = [];
const scanned = new Set();

for (const rule of RULES) {
  for (const dir of rule.scope) {
    for (const file of walk(path.join(ROOT, dir))) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      if (rule.skip && rule.skip.some((prefix) => rel.startsWith(prefix))) continue;
      scanned.add(rel);
      fs.readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (isCommentLine(line) || line.includes(IGNORE_MARK)) return;
          if (rule.re.test(line)) {
            findings.push(`${rel}:${index + 1}  [${rule.id}] ${rule.why}\n    ${line.trim()}`);
          }
        });
    }
  }
}

if (findings.length) {
  console.error(findings.join('\n'));
  console.error(`\naudit: ${findings.length} finding(s) in ${scanned.size} file(s) scanned`);
  process.exit(1);
}
console.log(`audit: 0 findings in ${scanned.size} file(s) scanned`);
