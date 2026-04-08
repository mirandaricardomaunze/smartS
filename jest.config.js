/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
  collectCoverageFrom: [
    'src/utils/**/*.ts',
    'src/config/**/*.ts',
    'src/services/**/*.ts',
    'src/features/hr/services/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
}
