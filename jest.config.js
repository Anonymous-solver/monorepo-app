module.exports = {
  roots: ["<rootDir>/server", "<rootDir>/client"],
  testMatch: ["**/__tests__/**/*.test.js"],
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest"
  },
//   testEnvironment: "jsdom"
};
