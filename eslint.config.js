import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Die 400-Zeilen-Regel gilt für jede projekteigene Code-Datei.
 * Der Ausschluss von components/ui ist in docs/ARCHITECTURE.md begründet:
 * dort liegt unveränderter shadcn/ui-Quelltext, also Fremdcode.
 */
const MAX_LINES = ['error', { max: 400, skipBlankLines: false, skipComments: false }];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'apps/web/src/components/ui/**',
      'packages/db/migrations/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      'max-lines': MAX_LINES,
      'max-depth': ['error', 4],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  {
    // Typerweiterungen für Express und express-session brauchen declaration
    // merging über einen Namespace. Ein ES-Modul kann das nicht ersetzen.
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/no-namespace': 'off' },
  },

  {
    // Befehlszeilenwerkzeuge geben ihr Ergebnis auf der Konsole aus —
    // das ist dort die Ausgabe und kein vergessenes Debug-Log.
    files: [
      'scripts/**/*.mjs',
      'scripts/**/*.ts',
      'packages/db/src/cli/**/*.ts',
      'packages/db/src/migrate.ts',
    ],
    rules: { 'no-console': 'off' },
  },
);
