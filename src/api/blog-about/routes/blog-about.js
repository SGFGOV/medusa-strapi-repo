"use strict";

/**
 * about router.
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::blog-about.blog-about", {
  prefix: "",
  only: ["find", "findOne", "create", "update", "delete", "createOrUpdate"],
  except: [],
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    findOne: { auth: false, policies: [], middlewares: [] },
    create: {},
    update: {},
    delete: {},
    createOrUpdate: {},
  },
});
