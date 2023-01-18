/* eslint-disable no-undef */
/* eslint-disable no-undef */
const request = require("supertest");

const {
  setupStrapi,
  clearStrapiDb,
  createTestDataObjects,
  sanitizeData,

  cleanupStrapi,
} = require("./helpers/strapi");
const fs = require("fs");
const { grantPrivilege } = require("./helpers/strapi");
const {
  hasMedusaRole,
} = require("strapi-plugin-medusajs/dist/server/services/setup");
const readdirSync = fs.readdirSync;
// const describe = require("jest").describe;
clearStrapiDb();
const includeUniqueFields = true;
let registeredUser = undefined;
const userTestCreds = {
  email: "hello@test.com",
  password: "test-password",
  username: "hello",
  firstname: "hello",
  provider: "local",
  // email:"hello@test.com",
};
const sanityCheckResult = {};
const postResult = {};
const getResult = {};
const putResult = {};
const deleteResult = {};
const adminEmail = process.env.SUPERUSER_EMAIL;
const adminPassword = process.env.SUPERUSER_PASSWORD;

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const PATH = `${__dirname}/../src/api`;
let apisGlobalVar = getDirectories(PATH);
// const apisCount = apisGlobalVar.length;
// console.log(`found ${apisCount} apis to test`);

const authCreds = {
  identifier: userTestCreds.email,
  password: userTestCreds.password,
  provider: "local",
};
delete authCreds.firstname;

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const testPostMock = jest
  .fn()
  .mockImplementation((apiName, testInfo) => testPost(apiName, testInfo));

async function testPost(apiName, testInfo) {
  const data = sanitizeData(testInfo);

  await delay(100);
  const creds = await request(strapi.server.httpServer)
    .post(`/api/auth/local`)
    .send(authCreds);
  expect(creds.status).toBe(200);
  // console.log(`posting  ${apiName}`);
  const r = await request(strapi.server.httpServer)
    .post(`/api/${apiName}`)
    .send({ data: data })
    .set("Authorization", `Bearer ${creds.body.jwt}`);

  const status = r.status == 200;
  expect(status).toBeTruthy();
  postResult[apiName] = r.body;
  expect(postResult[apiName].id).toBeDefined();
  return r.data;
}

async function testGet(apiName, id) {
  let s;
  if (!id) {
    s = await request(strapi.server.httpServer).get(`/api/${apiName}/`);
    expect(s.status).toBe(200);
  } else {
    const creds = await request(strapi.server.httpServer)
      .post(`/api/auth/local`)
      .send(authCreds);
    expect(creds.status).toBe(200);
    s = await request(strapi.server.httpServer)
      .get(`/api/${apiName}/${id}`)
      .set("Authorization", `Bearer ${creds.body.jwt}`);
    const status = s.status == 200;

    expect(status).toBeTruthy();
  }
  return s;
}

async function testPut(apiName, id, data) {
  const creds = await request(strapi.server.httpServer)
    .post(`/api/auth/local`)
    .send(authCreds);
  expect(creds.status).toBe(200);
  const s = await request(strapi.server.httpServer)
    .put(`/api/${apiName}/${id}`)
    .send({ data: data })
    .set("Authorization", `Bearer ${creds.body.jwt}`);
  expect(s.status).toBe(200);
  // Expect response http code 200
  const status = s.status == 200;
  expect(status).toBeTruthy();
  return s;
}

async function testDelete(apiName, id) {
  const creds = await request(strapi.server.httpServer)
    .post(`/api/auth/local`)
    .send(authCreds);
  expect(creds.status).toBe(200);
  const s = await request(strapi.server.httpServer)
    .delete(`/api/${apiName}/${id}`)
    .set("Authorization", `Bearer ${creds.body.jwt}`);
  expect(s.status).toBeDefined(); // Expect response http code 200
  const status = s.status == 200;
  expect(status).toBeTruthy();
  return s;
}

async function processTest(apiSingular, testInfo) {
  const apiUrl = testInfo.schema.info.pluralName;
  await testPostMock(apiUrl, testInfo);
}

const processing = [];
async function performPost(apiSingular, unchangingUnique) {
  const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;

  const testInfo = createTestDataObjects(
    schemaFilePath,
    includeUniqueFields,
    [],
    unchangingUnique
  );
  for (const dep of testInfo.deps) {
    if (apisGlobalVar.includes(dep)) {
      processing.push(dep);
      apisGlobalVar.splice(apisGlobalVar.indexOf(dep), 1);
      await performPost(dep, unchangingUnique);
      processing.pop();
    }
  }
  await processTest(apiSingular, testInfo);

  if (apisGlobalVar.includes(apiSingular)) {
    apisGlobalVar.splice(apisGlobalVar.indexOf(apiSingular), 1);
  }
}

function sanityCheckTest() {
  for (const apiSingular of apisGlobalVar) {
    it(`sanity check /get ${apiSingular}`, async () => {
      const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;
      const testInfo = createTestDataObjects(
        schemaFilePath,
        includeUniqueFields
      );
      const apiUrl = testInfo.schema.info.pluralName;
      sanityCheckResult[apiSingular] = await testGet(apiUrl);
      expect(sanityCheckResult[apiSingular]?.status).toBe(200);
    });
  }
}
async function executeLoginAsStrapiAdmin() {
  const auth = {
    email: adminEmail,
    password: adminPassword,
  };
  try {
    const response = await request(strapi.server.httpServer)
      .post(`/admin/login`)
      .send(auth)
      .set("Content-Type", "application/json");

    return response;
  } catch (error) {
    // Handle error.
    console.log.info(
      "An error occurred" + "while logging into admin:",
      error.message
    );
    throw error;
  }
}

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

    for (const api of apisGlobalVar) {
      try {
        await grantPrivilege(
          roleId,
          `permissions.application.controllers.${api}.index`
        );
      } catch (e) {
        // console.log(`role doesn't exist:${roleId}, ${e.message}`);
      }
    }
    const response = await executeLoginAsStrapiAdmin();
    expect(response.status).toBe(200);
    const token = response.body?.data?.token;
    registeredUser = await request(strapi.server.httpServer)
      .post(`/strapi-plugin-medusajs/create-medusa-user`)
      .send(userTestCreds)
      .set("Authorization", `Bearer ${token}`);
    expect(registeredUser.status).toBe(200);
  });

  afterAll(async () => {
    await cleanupStrapi();
  });

  async function testApis() {
    describe(`sanity testing testing get/`, () => {
      sanityCheckTest();
    });

    apisGlobalVar = getDirectories(PATH);
    it(`testing post with uniques`, async () => {
      while (apisGlobalVar.length > 0) {
        await performPost(apisGlobalVar[0], false);
      }
      expect(apisGlobalVar.length).toBe(0);
    });

    const apiTestList = getDirectories(PATH);
    count = 0;
    for (const apiSingular of apiTestList) {
      // console.log(`processing ${apiSingular}`);
      it(`testing  get individuals ${apiSingular}`, async () => {
        count++;
        const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;
        const testInfo = createTestDataObjects(schemaFilePath);
        const apiUrl = testInfo.schema.info.pluralName;
        if (postResult[apiUrl]) {
          getResult[apiSingular] = await testGet(
            apiUrl,
            postResult[apiUrl].medusa_id
          );
          expect(getResult[apiSingular]?.status).toBe(200);
          //     expect(getResult[apiSingular].body.data).toMatchObject(
          //     postResult[apiUrl]
          //   );
        } else {
          expect(1).toBe(0);
        }
      }, 60e3);
    }

    // apisGlobalVar = getDirectories(PATH);
    for (const apiSingular of apiTestList) {
      // console.log(`testing put ${apiSingular}`);
      it(`testing  put individuals ${apiSingular}`, async () => {
        const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;
        const testInfo = createTestDataObjects(
          schemaFilePath,
          includeUniqueFields
        );
        const apiUrl = testInfo.schema.info.pluralName;
        if (postResult[apiUrl]) {
          putResult[apiSingular] = await testPut(
            apiUrl,
            postResult[apiUrl].medusa_id,
            sanitizeData(testInfo)
          );
          //    expect(getResult[apiSingular].body).toMatchObject(postResult[apiUrl]);
          //    expect(getResult[apiSingular].body.data).toMatchObject(
          //      postResult[apiUrl]
          //    );
        } else {
          expect(1).toBe(0);
        }
      });
    }

    for (const apiSingular of apiTestList) {
      // console.log(`testing delete ${apiSingular}`);
      it(`testing  delete ${apiSingular}`, async () => {
        const schemaFilePath = `${PATH}/${apiSingular}/content-types/${apiSingular}/schema.json`;
        const testInfo = createTestDataObjects(
          schemaFilePath,
          includeUniqueFields
        );
        const apiUrl = testInfo.schema.info.pluralName;
        if (postResult[apiUrl]) {
          deleteResult[apiSingular] = await testDelete(
            apiUrl,
            postResult[apiUrl].medusa_id
          );
          expect(deleteResult[apiSingular]?.status).toBe(200);
        } else {
          expect(1).toBe(0);
        }
      });
    }
  }
  testApis().then(() => {
    //    expect(testPostMock).toHaveBeenCalledTimes(apisCount);
  });
});
// await request(strapi.server.httpServer).get("/api/countries").expect(200); // Expect response http code 200
