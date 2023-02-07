"use strict";

/**
 * author router.
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::blog-author.blog-author", {
  prefix: "",
  only: ["find", "findOne", "create", "update", "delete"],
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
  },
});
