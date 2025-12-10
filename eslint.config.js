import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsdoc from 'eslint-plugin-jsdoc'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	// Ignorer le build
	{ ignores: ['dist'] },

	// Règles globales pour tous les .ts / .tsx
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			jsdoc,
		},
		linterOptions: {
			reportUnusedDisableDirectives: 'off',
		},
		rules: {
			// Hooks : on reste strict (important)
			...reactHooks.configs.recommended.rules,

			// React fast refresh
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true },
			],

			// JSDoc recommandée + require-jsdoc seulement en warn
			...jsdoc.configs['flat/recommended'].rules,
			'jsdoc/require-jsdoc': [
				'warn',
				{
					publicOnly: true,
					require: {
						FunctionDeclaration: true,
						MethodDefinition: true,
						ClassDeclaration: true,
						ArrowFunctionExpression: true,
						FunctionExpression: true,
					},
					minLineCount: 5,
				},
			],

			// 🔽 On assouplit ici 🔽

			// Unused vars → warning + on tolère les noms qui commencent par "_"
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],

			// "any" → warning, n'empêche plus la CI de passer
			'@typescript-eslint/no-explicit-any': 'warn',
		},
		settings: {
			'import/resolver': {
				typescript: {},
			},
		},
	},

	// Optionnel : règles plus cool pour electron & tests
	{
		files: ['src/electron/**/*.{ts,tsx}'],
		rules: {
			// Dans electron on accepte plus volontiers du any
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{
		files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
)

