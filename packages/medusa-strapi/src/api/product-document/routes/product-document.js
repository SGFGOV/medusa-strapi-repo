"use strict";

/**
 * product-document router.
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::product-document.product-document", {
  prefix: "",
  only: ["find", "findOne", "create", "update", "delete"],
  except: [],
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    findOne: {},
    create: {},
    update: {},
    delete: {},
  },
});
