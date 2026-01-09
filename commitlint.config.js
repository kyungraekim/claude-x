export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allowed types
    'type-enum': [2, 'always', [
      'feat', // New feature
      'fix', // Bug fix
      'docs', // Documentation
      'style', // Formatting, missing semicolons, etc.
      'refactor', // Code restructuring
      'perf', // Performance improvement
      'test', // Adding tests
      'build', // Build system changes
      'ci', // CI configuration
      'chore', // Maintenance tasks
      'revert', // Revert previous commit
    ]],
    // Subject should not start with uppercase (except proper nouns)
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    // Max length for entire header
    'header-max-length': [2, 'always', 100],
  },
};
