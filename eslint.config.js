// eslint.config.js — Flat config (ESLint 9+)
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: ['node_modules', 'web/**/*.d.ts', 'web/**/*.js'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          modules: true,
          legacyDecorators: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-type-checked'].rules,
      ...tseslint.configs['stylistic-type-checked'].rules,

      // TypeScript handles undefined checks itself; no-undef would flag
      // global types declared in web/types.d.ts (see @typescript-eslint docs)
      'no-undef': 'off',
      // Cross-platform: repo files may be CRLF (Windows) or LF (Unix)
      'linebreak-style': 'off',

      'import/no-unresolved': ['off'],
      'class-methods-use-this': ['off'],
      'radix': ['off'],
      'import/prefer-default-export': ['off'],
      'implicit-arrow-linebreak': ['off'],
      'no-trailing-spaces': [
        'error', {
          'skipBlankLines': true,
          'ignoreComments': true,
        },
      ],
      'max-len': [
        'error', {
          'code': 120,
        },
      ],
      'prefer-rest-params': ['off'],

      'import/no-extraneous-dependencies': [
        'error', {
          'devDependencies': ['**/__tests__/*.ts', '**/__mocks__/*.ts'],
        },
      ],

      'one-var': ['off'],

      // false positive https://github.com/typescript-eslint/typescript-eslint/issues/2483
      'no-shadow': 'off',
      'object-curly-newline': ['error', {
        'ObjectExpression': { 'multiline': true, 'minProperties': 8 },
        'ObjectPattern': { 'multiline': true, 'minProperties': 8 },
        'ImportDeclaration': { 'multiline': true, 'minProperties': 8 },
        'ExportDeclaration': { 'multiline': true, 'minProperties': 8 },
      }],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          'allowShortCircuit': true,
          'allowTernary': true,
        },
      ],
      '@typescript-eslint/no-use-before-define': ['off'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 'argsIgnorePattern': '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': [
        'off', {
          allowArgumentsExplicitlyTypedAsAny: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'off',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          'allow': [
            'methods',
            'asyncMethods',
          ],
        },
      ],

      'lines-between-class-members': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',

      'curly': ['error', 'multi-line', 'consistent'],
      'no-unused-vars': 'off',
      'comma-dangle': ['error', 'only-multiline'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'eqeqeq': ['error', 'always'],
      'complexity': [
        'error', {
          max: 8,
        },
      ],
      'block-scoped-var': 'error',
      'no-else-return': [
        'error', {
          allowElseIf: true,
        },
      ],
      'no-debugger': 'off',
      'no-eval': 'error',
      'no-lone-blocks': 'error',
      'no-multi-spaces': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'no-console': [
        'off',
      ],
      'no-throw-literal': 'error',
      'newline-per-chained-call': [
        'error', {
          ignoreChainWithDepth: 4,
        },
      ],
      'no-extra-boolean-cast': [
        'error', {
          enforceForLogicalOperands: true,
        },
      ],
      'no-fallthrough': 'error',
      'no-use-before-define': 'off',
      'no-case-declarations': 'off',
    },
  },
];
