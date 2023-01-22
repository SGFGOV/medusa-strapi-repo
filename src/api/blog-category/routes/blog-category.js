"use strict";

/**
 * category router.
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::blog-category.blog-category", {
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
