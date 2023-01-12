/* eslint-disable no-undef */
const request = require("supertest");
const {
  setupStrapi,
  clearStrapiDb,
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
let registeredUser = undefined;
const userTestCreds = {
  email: "hello@test.com",
  password: "test-password",
  username: "hello",
  firstname: "hello",
  provider: "local",
  // email:"hello@test.com",
};
const postResult = {};
const getResult = {};
const adminEmail = process.env.SUPERUSER_EMAIL;
const adminPassword = process.env.SUPERUSER_PASSWORD;

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const path = `${__dirname}/../src/api`;
let apis = getDirectories(path);
const apisCount = apis.length;
const testString = `testabcd`;
const authCreds = {
  identifier: userTestCreds.email,
  password: userTestCreds.password,
  provider: "local",
};
delete authCreds.firstname;
function generataTestData(attribute) {
  switch (attribute.type) {
    case "text":
    case "richtext":
    case "uid":
    case "string": {
      const min = attribute.minLength;
      const max = attribute.maxLength;

      const testValue = testString.substring(
        0,
        max ?? min ?? testString.length
      );
      return testValue;
    }
    case "integer":
    case "biginteger":
    case "decimal":
    case "number": {
      const min = attribute.min;
      const max = attribute.max;
      return max ?? min ?? 1;
    }
    case "boolean":
      return true;
    case "enumeration":
      return attribute.enum[0];
    case "date":
    case "datetime":
      return new Date();
    case "json":
      return {
        name: "test",
        title: "test",
        inventory_quantity: 10,
        id: 1,
      };
    case "relation":
      return { medusa_id: "1", id: 1, name: "testabcd" };
  }
}

function createTestDataObjects(path) {
  // console.log("attempt to load:" + path);
  const schema = require(path);
  const schemaAttributes = Object.keys(schema.attributes);
  const arrayAttributes = schemaAttributes.map((m) => {
    return { attribName: m, ...schema.attributes[m] };
  });
  const requiredAttributes = arrayAttributes.filter((attrib) => {
    return attrib.required == true;
  });
  expect(requiredAttributes.length > 0).toBeTruthy();
  const deps = arrayAttributes
    .filter((v) => v.type == "relation" && v.inversedBy)
    .map((r) => {
      switch (r.relation) {
        case "manyToOne":
        case "oneToOne": {
          return r.attribName;
        }
        default:
          return r.target.split(".")[1];
      }
    });
  const d = {};
  for (const attribute of requiredAttributes) {
    const synthData = generataTestData(attribute);
    d[attribute.attribName] = synthData;
    d["id"] = 1;
    d["medusa_id"] = "1";
  }
  return {
    data: d,
    deps,
    schema,
  };
}
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const testPostMock = jest
  .fn()
  .mockImplementation((apiName, testInfo) =>
    Promise.resolve(testPost(apiName, testInfo))
  );

async function testPost(apiName, testInfo) {
  const data = testInfo.data;
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
  return data;
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
  // Expect response http code 200
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
  postResult[apiSingular] = await testPostMock(apiUrl, testInfo);
}

const processing = [];
async function performPost(apiSingular) {
  const schemaFilePath = `${path}/${apiSingular}/content-types/${apiSingular}/schema.json`;

  const testInfo = createTestDataObjects(schemaFilePath);
  for (const dep of testInfo.deps) {
    if (apis.includes(dep)) {
      processing.push(dep);
      apis.splice(apis.indexOf(dep), 1);
      await performPost(dep);
      processing.pop();
    }
  }
  await processTest(apiSingular, testInfo);

  if (apis.includes(apiSingular)) {
    apis.splice(apis.indexOf(apiSingular), 1);
  }
}

async function testApis() {
  it(`sanity testing testing get/`, async () => {
    for (const apiSingular of apis) {
      const schemaFilePath = `${path}/${apiSingular}/content-types/${apiSingular}/schema.json`;
      const testInfo = createTestDataObjects(schemaFilePath);
      const apiUrl = testInfo.schema.info.pluralName;
      getResult[apiSingular] = await testGet(apiUrl);
    }
  });

  it(`testing post`, async () => {
    while (apis.length > 0) {
      await performPost(apis[0]);
      //      count++;
    }
  });
  // postResult[apiSingular] = await testPost(apiUrl, testInfo.data);

  it(`testing  get individuals`, async () => {
    apis = getDirectories(path);
    for (const apiSingular of apis) {
      const schemaFilePath = `${path}/${apiSingular}/content-types/${apiSingular}/schema.json`;
      const testInfo = createTestDataObjects(schemaFilePath);
      const apiUrl = testInfo.schema.info.pluralName;
      if (postResult[apiSingular]) {
        getResult[apiSingular] = await testGet(
          apiUrl,
          postResult[apiSingular].medusa_id
        );
      }
    }
  });

  it(`testing  put individuals`, async () => {
    apis = getDirectories(path);
    for (const apiSingular of apis) {
      const schemaFilePath = `${path}/${apiSingular}/content-types/${apiSingular}/schema.json`;
      const testInfo = createTestDataObjects(schemaFilePath);
      const apiUrl = testInfo.schema.info.pluralName;
      if (postResult[apiSingular]) {
        getResult[apiSingular] = await testPut(
          apiUrl,
          postResult[apiSingular].medusa_id,
          postResult[apiSingular]
        );
      }
    }
  });
  it(`testing  delete`, async () => {
    const apis = getDirectories(path);
    for (const apiSingular of apis) {
      const schemaFilePath = `${path}/${apiSingular}/content-types/${apiSingular}/schema.json`;
      const testInfo = createTestDataObjects(schemaFilePath);
      const apiUrl = testInfo.schema.info.pluralName;
      if (postResult[apiSingular]) {
        getResult[apiSingular] = await testDelete(
          apiUrl,
          postResult[apiSingular].medusa_id
        );
      }
    }
  });
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
  describe("Testing strapi apis ", () => {
    describe("should return 200", (done) => {
      // const spy = jest.spyOn(testPost, testPost");

      testApis().then(() => {
        done;
      //    expect(testPostMock).toHaveBeenCalledTimes(apisCount);
      });

      // await request(strapi.server.httpServer).get("/api/countries").expect(200); // Expect response http code 200
    }, 600e3);
  }, 600e3);
}, 600e3);
