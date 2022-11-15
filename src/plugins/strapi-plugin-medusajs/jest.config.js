const path = require(`path`)
/** @type {import('ts-jest').JestConfigWithTsJest} */
/* const glob = require(`glob`)
const fs = require(`fs`)

const pkgs = glob.sync(`./packages/*`).map((p) => p.replace(/^\./, `<rootDir>`))

const reMedusa = /medusa$/
const medusaDir = pkgs.find((p) => reMedusa.exec(p))
const medusaBuildDirs = [`dist`].map((dir) => path.join(medusaDir??".", dir))
const builtTestsDirs = pkgs
  .filter((p) => fs.existsSync(path.join(p, `src`)))
  .map((p) => path.join(p, `__tests__`))
const distDirs = pkgs.map((p) => path.join(p, `dist`))
*/
const ignoreDirs = [].concat(
//  medusaBuildDirs,
//  builtTestsDirs,
//  distDirs,
  "./dist",

)

const coverageDirs = path.join(`./**/*.js`)
// const useCoverage = !!process.env.GENERATE_JEST_REPORT
// const projects = pkgs.map((pkg) => pkg.concat("/jest.config.js"))

module.exports = {
  notify: true,
  verbose: true,
  roots: [".","../../"],
  projects: ["."],
  modulePathIgnorePatterns: ignoreDirs,
  coveragePathIgnorePatterns: ignoreDirs,
  testPathIgnorePatterns: [
    `<rootDir>/examples/`,
    `<rootDir>/dist/`,
    `<rootDir>/node_modules/`,
    `__tests__/fixtures`,
  ],
  // moduleNameMapper: {
  //  "^highlight.js$": `<rootDir>/node_modules/highlight.js/lib/index.js`,
  // },
  // snapshotSerializers: [`jest-serializer-path`],
  collectCoverageFrom: [coverageDirs],
  preset: 'ts-jest',
  testEnvironment: 'node',
  // reporters: process.env.CI
  //  ? [[`jest-silent-reporter`, { useDots: true }]].concat(
  //      useCoverage ? `jest-junit` : []
  //    )
  //  : [`default`].concat(useCoverage ? `jest-junit` : []),
  // setupFiles: [`<rootDir>/.jestSetup.js`],
}
