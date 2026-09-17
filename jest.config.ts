import type { Config } from "jest"

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          module: "esnext",
          moduleResolution: "bundler",
          esModuleInterop: true,
          paths: {
            "@/*": ["./*"],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss)$": "<rootDir>/__tests__/mocks/style-mock.ts",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/\\.next/",
    "<rootDir>/__tests__/setup.ts",
    "<rootDir>/__tests__/mocks/",
  ],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "components/**/*.tsx",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
}

export default config
