"use strict";

/**
 * article router.
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::blog-article.blog-article", {
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
