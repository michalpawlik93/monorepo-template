/* eslint-disable */
export default {
  displayName: 'identity',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@app/identity$': '<rootDir>/src/index.ts',
    '^@app/core$': '<rootDir>/../../libs/core/src/index.ts',
    '^@app/core/prisma$': '<rootDir>/../../libs/core/src/providers/prisma/index.ts',
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/libs/identity',
};
