export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'ui',
        'tokens',
        'mock-api',
        'dashboard',
        'landing',
        'suite',
        'ci',
        'deps',
        'repo',
      ],
    ],
  },
};
