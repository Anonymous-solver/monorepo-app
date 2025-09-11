// module.exports = {
//   roots: ["<rootDir>/server", "<rootDir>/client"],
//   // roots: ["<rootDir>/server"],
//   testMatch: ["**/__tests__/**/*.test.js"],
//   transform: {
//     "^.+\\.[tj]sx?$": "babel-jest"
//   },
//   testEnvironment: "jsdom"
// };

module.exports = {
  roots: ["<rootDir>/server", "<rootDir>/client"],
  testMatch: ["**/__tests__/**/*.test.js"],
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
  testEnvironment: "node", // default for server
  projects: [
    {
      displayName: "server",
      testMatch: ["<rootDir>/server/**/__tests__/**/*.test.js"],
      testEnvironment: "node",
      setupFiles: ["<rootDir>/jest.setup.js"],
    },
    {
      displayName: "client",
      testMatch: ["<rootDir>/client/**/__tests__/**/*.test.js"],
      testEnvironment: "jsdom",
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    },
  ],
};

