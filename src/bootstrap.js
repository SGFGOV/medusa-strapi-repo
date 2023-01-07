"use strict";

const { hasSuperUser, createSuperUser } = require("./utils/utils");

// const setup = require("./dist/server/services/setup")
/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

module.exports = async (strapi) => {
  try {
    if (process.env.ENABLE_SUPER_USER == "true") {
      if (!(await hasSuperUser(strapi))) {
        await createSuperUser(strapi);
      } else {
        strapi.log.info("Found a Superuser account.");
      }
    }
  } catch (e) {
    /* if(await isFirstRun()){
    let medusaRoleId = await setup.hasMedusaRole(strapi)
    if (!medusaRoleId) {
      const plugins = await strapi.plugins[
        "users-permissions"
      ].services["users-permissions"].initialize();

      const permissions = await strapi.plugins[
        "users-permissions"
      ].services["users-permissions"].getActions(plugins)

      // eslint-disable-next-line guard-for-in
      for (const permission in permissions)
    {
      if(permissions[permission].controllers){
      setup.enabledCrudOnModels(permissions[permission].controllers)}
      
    }
    medusaRoleId = await setup.createMedusaRole(strapi,permissions)
    }
    /*
    let medusaUserId = await hasMedusaUser(strapi)
    if (!medusaUserId) {
      medusaUserId = await createMedusaUser(strapi,medusaRoleId)
    }*/

    console.log(e);
  }
};
