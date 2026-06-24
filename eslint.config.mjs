import { generateEslintConfig } from '@sofie-automation/code-standard-preset/eslint/main.mjs'

export default await generateEslintConfig({
	testRunner: 'vitest',
	tsconfigName: ['./tsconfig.build.json', './tsconfig.test.json'],
})
