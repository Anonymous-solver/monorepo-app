module.exports = {
  // roots: ["<rootDir>/server", "<rootDir>/client"],
  roots: ["<rootDir>/server"],
  testMatch: ["**/__tests__/**/*.test.js"],
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest"
  },
//   testEnvironment: "jsdom"
};
