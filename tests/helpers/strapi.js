const Strapi = require("@strapi/strapi");
const fs = require("fs");
const _ = require("lodash");
const qs = require("qs");
const FormData = require("formdata-node").FormData;
const request = require("supertest");
const userTestCreds = {
  email: "hello@test.com",
  password: "test-password",
  username: "hello",
  firstname: "hello",
  provider: "local",
  // email:"hello@test.com",
};
const authCreds = {
  identifier: userTestCreds.email,
  password: userTestCreds.password,
  provider: "local",
};

let instance;
async function clearStrapiDb() {
  const tmpDbFile = `./.tmp/test.db`;
  if (fs.existsSync(tmpDbFile)) {
    fs.unlinkSync(tmpDbFile);
  }
}

async function setupStrapi() {
  if (!instance) {
    await Strapi().load();
    // eslint-disable-next-line no-undef
    instance = strapi;

    await instance.server.mount();
  }
  // eslint-disable-next-line no-undef, no-unused-vars
  const dbSettings = strapi.config.get("database.connection");
  // eslint-disable-next-line no-undef, no-unused-vars
  return instance ?? strapi;
}

async function cleanupStrapi() {
  // eslint-disable-next-line no-undef
  const dbSettings = strapi.config.get("database.connection");

  // close server to release the db-file
  // eslint-disable-next-line no-undef
  await strapi.server.httpServer.close();
  // close the connection to the database before deletion
  // eslint-disable-next-line no-undef
  await strapi.db.connection.destroy();

  // delete test database after all tests have completed
  if (dbSettings && dbSettings.connection && dbSettings.connection.filename) {
    const tmpDbFile = dbSettings.connection.filename;
    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }
  }
  // eslint-disable-next-line no-undef
  await strapi.destroy();
}

const grantPrivilege = async (
  roleID = 1,
  path,
  enabled = true,
  policy = ""
) => {
  // eslint-disable-next-line no-undef
  const service = strapi.plugin("users-permissions").service("role");

  const role = await service.findOne(roleID);

  _.set(role.permissions, path, { enabled, policy });

  return service.updateRole(roleID, role);
};

/** Updates database `permissions` that role can access an endpoint
 * @see grantPrivilege
 */

const grantPrivileges = async (roleID = 1, values = []) => {
  await Promise.all(values.map((val) => grantPrivilege(roleID, val)));
};
const PATH = `${__dirname}/../../src/api`;
function generateTestData(
  attribute,
  includeUnqiueFields,
  processedRelations = [],
  unchangingUnique = false
) {
  let testString = `testabcd`;
  if (attribute.unique && !unchangingUnique) {
    testString = Math.random().toString(36).substring(2, 10);
  }
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
    /* case "media": {
      const file = new FormData();
      file.append("files", "../fixtures/test.pdf");
      file.append("field", "files");
      return file;
    }*/
    case "boolean":
      return true;
    case "enumeration":
      return attribute.enum[0];
    case "date":
    case "datetime":
      return new Date().toISOString();
    case "json":
      return {
        name: "test",
        title: "test",
        inventory_quantity: 10,
        id: 1,
      };
    case "relation": {
      if (attribute.mappedBy && attribute.attribName) {
        const testCircular = processedRelations.includes(attribute.attribName);
        if (!testCircular) {
          processedRelations.push(attribute.attribName);
        } else {
          processedRelations.push(attribute.attribName);
          console.error(
            "circular relationship between " + processedRelations.join("->")
          );
          process.exit(1);
        }
        const apiName = attribute.target.split(".")[1];
        // console.log("processing relation:" + attribute.attribName);
        const schemaFilePath = `${PATH}/${apiName}/content-types/${apiName}/schema.json`;
        const result = createTestDataObjects(
          schemaFilePath,
          includeUnqiueFields,
          processedRelations,
          unchangingUnique
        );
        processedRelations.pop();
        return result;
      }
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createTestDataObjects(
  path,
  includeUnqiueFields,
  processedRelations = [],
  unchangingUnique
) {
  // console.log("attempt to load:" + path);
  const schema = require(path);
  const schemaAttributes = Object.keys(schema.attributes);
  const arrayAttributes = schemaAttributes.map((m) => {
    return { attribName: m, ...schema.attributes[m] };
  });
  const requiredAttributes = arrayAttributes.filter((attrib) => {
    return (
      attrib.required == true ||
      (attrib.unique != undefined && includeUnqiueFields) ||
      attrib.type == "relation" ||
      attrib.type == "media"
    );
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
  const nonMediaData = {};
  const mediaData = new FormData();

  const file = fs.readFileSync(`${__dirname}/../fixtures/test-1.pdf`);
  mediaData.append("files", file);
  const isMedia = containsMediaType(schema);
  for (const attribute of requiredAttributes) {
    if (!isMedia) {
      const synthesisedTestData = generateTestData(
        attribute,
        includeUnqiueFields,
        processedRelations,
        unchangingUnique
      );
      if (synthesisedTestData) {
        nonMediaData[attribute.attribName] = synthesisedTestData;
        nonMediaData["medusa_id"] = `1`;
      }
    } else {
      if (
        attribute.attribName == "files" ||
        attribute.attribName == "medusa_id"
      ) {
        continue;
      }
      const synthesisedTestData = generateTestData(
        attribute,
        includeUnqiueFields,
        processedRelations,
        unchangingUnique
      );
      if (synthesisedTestData) {
        mediaData.append(attribute.attribName, synthesisedTestData);
      }
    }
    //  d["id"] = 1;
  }
  mediaData.append("medusa_id", "1");
  let retValue;
  if (!isMedia) {
    retValue = {
      ...nonMediaData,
      deps,
      schema,
    };
  } else {
    retValue = mediaData;
    retValue["deps"] = deps;
    retValue["schema"] = schema;
  }

  return retValue;
}
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeData(data) {
  const keys = Object.keys(data);

  for (const key of keys) {
    if (key == "deps" || key == "schema") {
      delete data[key];
    } else if (Array.isArray(data[key])) {
      for (const obj of data[key]) {
        sanitizeData(obj);
      }
    } else if (data[key] instanceof Object && key != "files") {
      sanitizeData(data[key]);
    }
  }
  return data;
}

function createStrapiRestQuery(strapiQuery) {
  const {
    sort,
    filters,
    populate,
    fields,
    pagination,
    publicationState,
    locale,
  } = strapiQuery;

  const query = qs.stringify(
    {
      sort,
      filters,
      populate,
      fields,
      pagination,
      publicationState,
      locale,
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );
  return query;
}

function containsAttributeOfType(schema, type) {
  const keys = Object.keys(schema.attributes);
  for (const key of keys) {
    if (schema.attributes[key].type == type) {
      return true;
    }
  }
  return false;
}

function namesAttributeOfType(schema, type) {
  const keys = Object.keys(schema.attributes);
  return keys
    .map((key) => {
      if (schema.attributes[key].type == type) {
        return key;
      }
    })
    .filter((r) => r != undefined);
}

function containsMediaType(schema) {
  return containsAttributeOfType(schema, "media");
}
async function flushDb() {}

async function executeLoginAsStrapiAdmin(email, password, strapi) {
  const auth = {
    email: email,
    password: password,
  };
  try {
    const response = await request(strapi.server.httpServer)
      .post(`/admin/login`)
      .send(auth)
      .set("Content-Type", "application/json");

    return response;
  } catch (error) {
    // Handle error.
    console.error(
      "An error occurred" + "while logging into admin:",
      error.message
    );
    throw error;
  }
}

module.exports = {
  setupStrapi,
  sanitizeData,
  clearStrapiDb,
  flushDb,
  cleanupStrapi,
  grantPrivilege,
  grantPrivileges,
  delay,
  generateTestData,
  createTestDataObjects,
  createStrapiRestQuery,
  containsMediaType,
  containsAttributeOfType,
  executeLoginAsStrapiAdmin,
  namesAttributeOfType,
  userTestCreds,
  authCreds,
  sleep,
};
