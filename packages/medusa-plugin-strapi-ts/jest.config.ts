export default {
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.spec.json',
		},
	},
	moduleFileExtensions: ['js', 'json', 'ts'],
	testPathIgnorePatterns: ['/node_modules/', '<rootDir>/node_modules/'],
	rootDir: 'src',
	testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|js)$',
	transform: {
		'.ts': 'ts-jest',
	},
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: './coverage',
	testEnvironment: 'node',
	bail: true,
	maxWorkers: 1,
	testTimeout: 300000,
};
