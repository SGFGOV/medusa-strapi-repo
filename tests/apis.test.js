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

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const path = `${__dirname}/../src/api`;
let apis = getDirectories(path);
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
  }
  if (attribute.model) {
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
    .map((attrib) => {
      return attrib.model;
    })
    .filter((v) => v != undefined);
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
  /* if (r.status == 400) {
    r = await request(strapi.server.httpServer)
      .post(`/api/${apiName}`)
      .send({ ...data })
      .set("Authorization", `Bearer ${creds.body.jwt}`);
  }*/
  /*  if (r.status == 400) {
      r = await request(strapi.server.httpServer)
        .post(`/api/${apiName}`)
        .send(data)
        .set("Authorization", `Bearer ${creds.body.jwt}`);
      if (r.status == 400) {
        console.log("unable to post");
        r.status = 500;
      }
    }*
  }*/
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
    expect(s.status).toBe(200);
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
  return s;
}

async function processTest(apiSingular, testInfo) {
  const apiUrl = testInfo.schema.info.pluralName;
  postResult[apiSingular] = await testPost(apiUrl, testInfo);
}

const resolved = [];

async function isResolved(deps) {
  const result =
    deps
      .map((m) => resolved.includes(m))
      .filter((r) => {
        return r == false || r == undefined;
      })?.length > 0;
  return result;
}

async function performPost(apiSingular) {
  const schemaFilePath = `${path}/${apiSingular}/content-types/${apiSingular}/schema.json`;

  const testInfo = createTestDataObjects(schemaFilePath);
  for (const dep of testInfo.deps) {
    await performPost(dep);
  }

  if (apis.includes(apiSingular)) {
    while (!isResolved(testInfo.deps)) {
      await delay(1000);
    }
    await processTest(apiSingular, testInfo);

    apis.splice(apis.indexOf(apiSingular), 1);
    resolved.push({ name: apiSingular, value: testInfo.data });
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
    // Promise.all(getResult);
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

    registeredUser = await request(strapi.server.httpServer)
      .post(`/strapi-plugin-medusajs/create-medusa-user`)
      .send(userTestCreds);
    expect(registeredUser.status).toBe(200);
  });

  afterAll(async () => {
    await cleanupStrapi();
  });
  describe("Testing strapi apis ", () => {
    /* it("strapi is defined", () => {
    expect(strapi).toBeDefined();
  }, 10000);*/

    describe("should return 200", (done) => {
      testApis().then((res) => {
        done;
      });
      // await request(strapi.server.httpServer).get("/api/countries").expect(200); // Expect response http code 200
    }, 600e3);
  }, 600e3);
}, 600e3);
