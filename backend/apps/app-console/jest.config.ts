/* eslint-disable */
export default {
  displayName: 'app-console',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleNameMapper: {
    '^@app/products$': '<rootDir>/../../libs/products/src/index.ts',
    '^@app/app-console$': '<rootDir>/src/main.ts'
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/apps/app-console'
};
