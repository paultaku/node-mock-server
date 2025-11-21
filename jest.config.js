module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/__tests__/**/*.tsx",
    "**/?(*.)+(spec|test).ts",
    "**/?(*.)+(spec|test).tsx",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.tsx$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.d.ts",
    "!src/cli/**/*.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
  // Use different test environments for different file types
  projects: [
    {
      displayName: "backend",
      testEnvironment: "node",
      testMatch: ["**/tests/unit/**/*.test.ts", "**/tests/integration/**/*.test.ts"],
      transform: {
        "^.+\\.ts$": "ts-jest",
      },
    },
    {
      displayName: "frontend",
      testEnvironment: "jsdom",
      testMatch: ["**/tests/frontend/**/*.test.tsx"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: {
              jsx: "react-jsx",
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              lib: ["ES2020", "DOM"],
              target: "ES2020",
            },
          },
        ],
      },
      setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
    },
  ],
};
