import globals from "globals"
import tseslint from 'typescript-eslint'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

const eslintConfig = [
  {
    ignores: ["eslint.config.js", "next.config.ts", "src/components/ui/*.tsx"]
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginPrettier,
  {
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: true,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true }
      }
    },
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-void': 'off',
      '@typescript-eslint/restrict-plus-operands': ['error', { allowAny: true }],
      'arrow-body-style': ['off', 'never'],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }],
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-floating-promises': ['error', { ignoreIIFE: true }],
      'prettier/prettier': [
        'error',
        {
          'singleQuote': true,
          'semi': false,
          'experimentalTernaries': true
        }
      ]
    }
  }
]

export default eslintConfig;
