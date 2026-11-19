module.exports = {
	moduleFileExtensions: ['ts', 'js'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.json',
			},
		],
	},
	testMatch: ['**/__tests__/**/*.spec.(ts|js)'],
	setupFilesAfterEnv: ['jest-extended/all'],
	testEnvironment: 'node',
	coverageThreshold: {
		global: {
			branches: 0,
			functions: 0,
			lines: 0,
			statements: 0,
		},
	},
	coverageDirectory: './coverage/',
	collectCoverage: true,
	collectCoverageFrom: [
		'src/**/*.{js,ts}',
		'!**/@types/**',
		'!**/__tests__/**',
		'!**/__mocks__/**',
		'!**/node_modules/**',
		'!**/dist/**',
	],
}
