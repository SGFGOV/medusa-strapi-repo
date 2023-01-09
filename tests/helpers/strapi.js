const Strapi = require("@strapi/strapi");
const fs = require("fs");
const _ = require("lodash");

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

async function flushDb() {}

module.exports = {
  setupStrapi,
  clearStrapiDb,
  flushDb,
  cleanupStrapi,
  grantPrivilege,
  grantPrivileges,
};
