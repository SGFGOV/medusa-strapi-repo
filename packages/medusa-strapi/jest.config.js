module.exports = {
  testPathIgnorePatterns: ["/node_modules/", ".tmp", ".cache"],
  testEnvironment: "node",
  reporters: ["jest-progress-bar-reporter", "jest-html-reporters"],
};
