import { danger, warn, fail, message, markdown } from 'danger';

const bigPRThreshold = 500;
const changedFiles = danger.git.created_files.length + danger.git.modified_files.length;
const deletedFiles = danger.git.deleted_files.length;

if (changedFiles - deletedFiles > bigPRThreshold) {
  warn('This PR has too many changed files. Consider breaking it into smaller PRs.');
}

const pr = danger.github.pr;
if (!pr.body || pr.body.length < 10) {
  fail('Please add a description to your PR.');
}

if (pr.title.includes('WIP') || pr.title.includes('[WIP]') || pr.draft) {
  message('This PR is marked as Work in Progress.');
}

const commits = danger.git.commits;
const invalidCommits = commits.filter((commit) => {
  const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?:.+/;
  return !conventionalPattern.test(commit.message);
});

if (invalidCommits.length > 0) {
  warn('Some commits do not follow conventional commit format.');
}

const hasChangelog = danger.git.modified_files.includes('CHANGELOG.md');
if (!hasChangelog) {
  warn('Consider updating the CHANGELOG.md');
}

const hasAppChanges = danger.git.modified_files.some((f) => f.startsWith('src/'));
const hasTestChanges = danger.git.modified_files.some((f) => f.includes('.test.'));

if (hasAppChanges && !hasTestChanges) {
  warn('No test files were updated.');
}

const hasMigrationChanges = danger.git.created_files
  .concat(danger.git.modified_files)
  .some((f) => f.includes('supabase/migrations/'));

if (hasMigrationChanges) {
  message('Database migration detected. Please ensure it is tested.');
}

const securitySensitiveFiles = ['src/lib/auth.ts', 'src/lib/database.ts', 'supabase/migrations/'];
const hasSecurityChanges = danger.git.modified_files.some((f) =>
  securitySensitiveFiles.some((sensitive) => f.includes(sensitive))
);

if (hasSecurityChanges) {
  fail('Security-sensitive files were modified. Ensure thorough review.');
}

markdown('## PR Stats\n- Files changed: ' + changedFiles + '\n- Commits: ' + commits.length);
