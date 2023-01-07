"use strict";

/**
 *  country controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::country.country", {
  async create(ctx) {
    console.log(ctx);
  },
});
