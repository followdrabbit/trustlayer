/**
 * Danger.js - Automated PR Review
 *
 * This file contains rules for automated code review using Danger.js
 * Runs on every Pull Request to enforce best practices and guidelines
 */

import { danger, warn, fail, message, markdown } from 'danger';

// ============================================
// Configuration
// ============================================

const config = {
  minDescriptionLength: 50,
  maxPRSize: 500, // lines changed
  maxFilesChanged: 20,
  requiredLabels: ['feature', 'bugfix', 'refactor', 'docs', 'chore'],
};

// ============================================
// PR Metadata Checks
// ============================================

// Check PR has description
if (!danger.github.pr.body || danger.github.pr.body.length < config.minDescriptionLength) {
  fail(
    `⚠️ Please add a description to your PR (minimum ${config.minDescriptionLength} characters). ` +
    'Include context, what changed, and why.'
  );
}

// Check PR title follows convention
const prTitle = danger.github.pr.title;
const titlePattern = /^(feat|fix|refactor|docs|chore|test|style|perf|ci)(\(.+\))?: .+/;

if (!titlePattern.test(prTitle)) {
  warn(
    '⚠️ PR title should follow conventional commits format: ' +
    '`type(scope): description`\n\n' +
    'Examples:\n' +
    '- `feat(auth): add SAML 2.0 support`\n' +
    '- `fix(dashboard): correct score calculation`\n' +
    '- `docs(api): update authentication guide`'
  );
}

// Check PR has labels
const hasLabels = danger.github.issue.labels.length > 0;
if (!hasLabels) {
  warn(
    '⚠️ Please add at least one label to this PR:\n' +
    config.requiredLabels.map(l => `- \`${l}\``).join('\n')
  );
}

// ============================================
// Size Checks
// ============================================

const changes = danger.github.pr.additions + danger.github.pr.deletions;
const filesChanged = danger.git.modified_files.length + danger.git.created_files.length;

if (changes > config.maxPRSize) {
  warn(
    `⚠️ This PR is quite large (${changes} lines changed). ` +
    `Consider splitting it into smaller PRs for easier review.`
  );
}

if (filesChanged > config.maxFilesChanged) {
  warn(
    `⚠️ This PR modifies ${filesChanged} files. ` +
    `Consider breaking it down into smaller, focused PRs.`
  );
}

// ============================================
// Documentation Checks
// ============================================

const modifiedFiles = danger.git.modified_files;
const createdFiles = danger.git.created_files;
const allFiles = [...modifiedFiles, ...createdFiles];

// Check if documentation was updated for code changes
const hasCodeChanges = allFiles.some(f =>
  f.match(/\.(ts|tsx|js|jsx)$/) &&
  !f.includes('test') &&
  !f.includes('spec') &&
  !f.includes('.stories.')
);

const hasDocChanges = allFiles.some(f =>
  f.match(/\.(md)$/) || f.includes('docs/')
);

if (hasCodeChanges && !hasDocChanges) {
  warn(
    '⚠️ Code changes detected but no documentation updates found. ' +
    'Consider updating relevant docs in `/docs` folder.'
  );
}

// Check if CHANGELOG was updated
const hasChangelogUpdate = modifiedFiles.includes('docs/CHANGELOG.md');

if (hasCodeChanges && !hasChangelogUpdate && !prTitle.includes('chore')) {
  warn(
    '⚠️ Consider updating `docs/CHANGELOG.md` to document your changes. ' +
    'This helps with release notes.'
  );
}

// ============================================
// Test Coverage Checks
// ============================================

const hasTestChanges = allFiles.some(f =>
  f.includes('test') || f.includes('spec') || f.includes('__tests__')
);

const hasNewFeature = prTitle.toLowerCase().includes('feat') ||
  danger.github.issue.labels.some(l => l.name === 'feature');

if (hasNewFeature && !hasTestChanges) {
  warn(
    '⚠️ New feature detected but no test files modified. ' +
    'Please add tests to ensure the feature works as expected.'
  );
}

// ============================================
// Migration Checks
// ============================================

const hasMigrationChanges = allFiles.some(f =>
  f.includes('migrations') || f.includes('supabase/migrations')
);

if (hasMigrationChanges) {
  message(
    '📝 **Database migration detected!**\n\n' +
    'Please ensure:\n' +
    '- [ ] Migration is reversible (has rollback)\n' +
    '- [ ] Migration has been tested locally\n' +
    '- [ ] Migration includes proper indexes\n' +
    '- [ ] RLS policies are updated if needed\n' +
    '- [ ] Documentation is updated with schema changes'
  );
}

// ============================================
// Security Checks
// ============================================

// Check for potential secrets
const secretPatterns = [
  /password\s*=\s*['"][^'"]+['"]/i,
  /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
  /secret\s*=\s*['"][^'"]+['"]/i,
  /token\s*=\s*['"][^'"]+['"]/i,
];

for (const file of allFiles) {
  const diff = danger.git.diffForFile(file);
  if (!diff) continue;

  const content = diff.then(d => d?.diff);
  content.then(c => {
    if (!c) return;

    secretPatterns.forEach(pattern => {
      if (pattern.test(c)) {
        fail(
          `🔒 **Potential secret detected in \`${file}\`!**\n\n` +
          'Please ensure you are not committing:\n' +
          '- Passwords\n' +
          '- API keys\n' +
          '- Tokens\n' +
          '- Secrets\n\n' +
          'Use environment variables or secret management instead.'
        );
      }
    });
  });
}

// Check for console.log in production code
const hasConsoleLogs = allFiles.some(file => {
  if (!file.match(/\.(ts|tsx|js|jsx)$/) || file.includes('test')) return false;

  const diff = danger.git.diffForFile(file);
  return diff.then(d => {
    if (!d?.diff) return false;
    return /console\.(log|debug|info|warn|error)/.test(d.diff);
  });
});

Promise.resolve(hasConsoleLogs).then(has => {
  if (has) {
    warn(
      '⚠️ `console.log` statements detected. ' +
      'Consider using a proper logging library or remove before merge.'
    );
  }
});

// ============================================
// Dependencies Checks
// ============================================

const hasPackageJsonChanges = modifiedFiles.includes('package.json');
const hasPackageLockChanges = modifiedFiles.includes('package-lock.json');

if (hasPackageJsonChanges && !hasPackageLockChanges) {
  fail(
    '❌ `package.json` was modified but `package-lock.json` was not updated. ' +
    'Please run `npm install` to update the lockfile.'
  );
}

if (hasPackageJsonChanges) {
  message(
    '📦 **Dependencies changed!**\n\n' +
    'Please ensure:\n' +
    '- [ ] New dependencies are necessary\n' +
    '- [ ] Dependencies are from trusted sources\n' +
    '- [ ] Security audit passed (`npm audit`)\n' +
    '- [ ] Bundle size impact is acceptable'
  );
}

// ============================================
// Breaking Changes Check
// ============================================

const hasBreakingChange = prTitle.includes('!') ||
  (danger.github.pr.body || '').toLowerCase().includes('breaking change');

if (hasBreakingChange) {
  warn(
    '⚠️ **Breaking change detected!**\n\n' +
    'Please ensure:\n' +
    '- [ ] Migration guide is provided\n' +
    '- [ ] CHANGELOG documents the breaking change\n' +
    '- [ ] Major version bump is planned\n' +
    '- [ ] All affected code is updated'
  );
}

// ============================================
// TypeScript Strict Checks
// ============================================

const hasTsFiles = allFiles.some(f => f.match(/\.tsx?$/));

if (hasTsFiles) {
  // Check for @ts-ignore or @ts-expect-error
  for (const file of allFiles.filter(f => f.match(/\.tsx?$/))) {
    const diff = danger.git.diffForFile(file);
    diff.then(d => {
      if (!d?.diff) return;

      if (/@ts-ignore|@ts-expect-error/.test(d.diff)) {
        warn(
          `⚠️ TypeScript suppression detected in \`${file}\`. ` +
          'Consider fixing the type issue instead of suppressing it.'
        );
      }

      if (/any\b/.test(d.diff) && !d.diff.includes('// eslint-disable-next-line')) {
        warn(
          `⚠️ \`any\` type detected in \`${file}\`. ` +
          'Consider using proper types for better type safety.'
        );
      }
    });
  }
}

// ============================================
// PR Stats Summary
// ============================================

const statsTable = `
| Metric | Value |
|--------|-------|
| Lines Added | ${danger.github.pr.additions} |
| Lines Deleted | ${danger.github.pr.deletions} |
| Files Changed | ${filesChanged} |
| Commits | ${danger.github.commits.length} |
`;

markdown(`## PR Statistics\n${statsTable}`);

// ============================================
// Checklist Reminder
// ============================================

const hasChecklist = (danger.github.pr.body || '').includes('- [ ]') ||
  (danger.github.pr.body || '').includes('- [x]');

if (!hasChecklist && hasCodeChanges) {
  message(
    '✅ **Consider adding a checklist to your PR description:**\n\n' +
    '```markdown\n' +
    '## Checklist\n' +
    '- [ ] Tests added/updated\n' +
    '- [ ] Documentation updated\n' +
    '- [ ] CHANGELOG updated\n' +
    '- [ ] No breaking changes (or documented)\n' +
    '- [ ] Tested locally\n' +
    '```'
  );
}

// ============================================
// ADR Requirement for Architecture Changes
// ============================================

const hasArchitectureChanges = allFiles.some(f =>
  f.includes('core/') ||
  f.includes('architecture/') ||
  prTitle.toLowerCase().includes('architecture') ||
  prTitle.toLowerCase().includes('refactor')
);

const hasADR = allFiles.some(f => f.includes('docs/adr/'));

if (hasArchitectureChanges && !hasADR) {
  warn(
    '⚠️ Architecture changes detected. ' +
    'Consider creating an ADR (Architecture Decision Record) in `docs/adr/` ' +
    'to document the decision and rationale.'
  );
}

// ============================================
// Success Message
// ============================================

if (danger.github.issue.labels.length > 0 &&
    hasTestChanges &&
    hasDocChanges &&
    changes < config.maxPRSize) {
  message('✅ Great PR! Well documented, tested, and sized appropriately.');
}
