/* eslint-disable no-undef */
/* eslint-disable no-undef */
const {
  setupStrapi,
  clearStrapiDb,
  cleanupStrapi,
  createTestDataObjects,
  sanitizeData,
} = require("./helpers/strapi");
const fs = require("fs");
const { grantPrivilege } = require("./helpers/strapi");
const {
  hasMedusaRole,
} = require("strapi-plugin-medusajs/dist/server/services/setup");

const readdirSync = fs.readdirSync;
// const describe = require("jest").describe;
clearStrapiDb();
const userTestCreds = {
  email: "hello@test.com",
  password: "test-password",
  username: "hello",
  firstname: "hello",
  provider: "local",
  // email:"hello@test.com",
};
const PATH = `${__dirname}/../src/api`;

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const apis = getDirectories(PATH);
const apisCount = apis.length;
console.log(`found ${apisCount} apis to test`);
const authCreds = {
  identifier: userTestCreds.email,
  password: userTestCreds.password,
  provider: "local",
};
delete authCreds.firstname;

function clearRequireCache() {
  Object.keys(require.cache).forEach(function (key) {
    delete require.cache[key];
  });
}
jest.setTimeout(3e6);
describe("Testing strapi ", () => {
  beforeAll(async () => {
    clearRequireCache();
    await setupStrapi();
    const roleId = await hasMedusaRole();

    for (const api of apis) {
      try {
        await grantPrivilege(
          roleId,
          `permissions.application.controllers.${api}.index`
        );
      } catch (e) {
        console.log(`role doesn't exist:${roleId}, ${e.message}`);
      }
    }
  });

  afterAll(async () => {
    await cleanupStrapi();
  });

  describe("Testing Strapi Api Services with unique ids all generated", () => {
    const apis = getDirectories(PATH);

    for (const apiSingular of apis) {
      const PATH = `${__dirname}/../src/api`;
      const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;

      const uid = `api::${apiSingular}.${apiSingular}`;
      describe(`testing service ${uid}`, () => {
        it(`test CRUD ${uid}`, async () => {
          const testInfo = createTestDataObjects(schemaFilePath, true);
          const data = sanitizeData(testInfo);
          const service = strapi.service(uid);
          const entityCreated = await service.create({ data: data });
          expect(entityCreated.id).toBeDefined();
          let entityRead = await service.findOne(entityCreated.id);
          expect(entityRead.id).toBeDefined();
          const entityUpdated = await service.update(entityCreated.id, {
            data: data,
          });
          expect(entityUpdated.id).toBeDefined();
          expect(entityRead.id).toBeDefined();
          const entityDeleted = await service.delete(entityUpdated.id);
          expect(entityDeleted.id).toBeDefined();
          try {
            entityRead = await service.findOne(entityCreated.id);
          } catch (e) {
            entityRead = undefined;
          }
          expect(entityRead).toBeNull();
        });
      });
    }
  });
}, 600e3);
