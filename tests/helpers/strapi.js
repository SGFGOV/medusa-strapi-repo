const Strapi = require("@strapi/strapi");
const fs = require("fs");
const _ = require("lodash");
const qs = require("qs");

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
    instance = strapi;

    await instance.server.mount();
  }
  const dbSettings = strapi.config.get("database.connection");

  return instance;
}

async function cleanupStrapi() {
  const dbSettings = strapi.config.get("database.connection");

  // close server to release the db-file
  await strapi.server.httpServer.close();
  // close the connection to the database before deletion
  await strapi.db.connection.destroy();

  // delete test database after all tests have completed
  if (dbSettings && dbSettings.connection && dbSettings.connection.filename) {
    const tmpDbFile = dbSettings.connection.filename;
    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }
  }
  await strapi.destroy();
}

const grantPrivilege = async (
  roleID = 1,
  path,
  enabled = true,
  policy = ""
) => {
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
      attrib.type == "relation"
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
  const d = {};
  for (const attribute of requiredAttributes) {
    const synthesisedTestData = generateTestData(
      attribute,
      includeUnqiueFields,
      processedRelations,
      unchangingUnique
    );
    if (synthesisedTestData) {
      d[attribute.attribName] = synthesisedTestData;
    }

    //  d["id"] = 1;
    d["medusa_id"] = `1`;
  }
  return {
    ...d,
    deps,
    schema,
  };
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
    } else if (data[key] instanceof Object) {
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

async function flushDb() {}

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
};
