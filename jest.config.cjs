const baseTransform = {
    "^.+\\.(ts|tsx)$": [
        "ts-jest",
        {
            tsconfig: "./tsconfig.jest.json",
        },
    ],
};

const moduleNameMapper = {
    "^@/(.*)\\.js$": "<rootDir>/src/$1.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^.+\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^\\./util\\.js$": "<rootDir>/src/electron/util.ts",
};

const baseProject = {
    transform: baseTransform,
    moduleNameMapper,
};

module.exports = {
    verbose: false,
    projects: [
        {
            displayName: "unit",
            testEnvironment: "node",
            testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
            ...baseProject,
        },
        {
            displayName: "integration",
            testEnvironment: "node",
            testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
            ...baseProject,
        },
        {
            displayName: "ui",
            testEnvironment: "jsdom",
            setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
            testMatch: ["<rootDir>/tests/ui/**/*.test.tsx"],
            ...baseProject,
        },
    ],
    collectCoverageFrom: ["src/**/*.{ts,tsx}"],
    coveragePathIgnorePatterns: ["/node_modules/", "/dist/", "/tests/"],
};
