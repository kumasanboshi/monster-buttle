module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/main.ts',
    '!src/scenes/BaseScene.ts',
    '!src/scenes/BootScene.ts',
    '!src/scenes/TitleScene.ts',
    '!src/scenes/CharacterSelectScene.ts',
    '!src/scenes/BattleScene.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
};
