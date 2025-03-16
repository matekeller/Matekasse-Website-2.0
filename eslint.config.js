import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginImport from 'eslint-plugin-import'
import globals from "globals"
import tseslint from 'typescript-eslint'

const eslintConfig = [
  {
    ignores: ["eslint.config.js", "next.config.ts", "src/components/ui/*.tsx"]
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  eslintPluginPrettier,
  eslintPluginImport.flatConfigs.recommended,
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
    plugins: {
     eslintPluginReact,
     eslintPluginPrettier,
    },
    rules: {
      'func-style': ['error', 'expression'],
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
          'experimentalTernaries': true,
        }
      ],
      'import/order': ['error'],
      'import/no-unresolved': ['off'], // buggy?
      'react/function-component-definition': ['error', { namedComponents: ['arrow-function', 'function-declaration'] }],
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]

export default eslintConfig;
