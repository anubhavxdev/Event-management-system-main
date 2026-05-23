import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Ignore unused vars that start with uppercase or underscore, or are 'motion'
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]|motion', argsIgnorePattern: '^_' }],
      // Allow exporting hooks alongside components in context files
      'react-refresh/only-export-components': 'off',
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
  },
])
