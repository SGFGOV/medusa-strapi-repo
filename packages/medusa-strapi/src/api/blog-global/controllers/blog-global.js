"use strict";

/**
 *  global controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::blog-global.blog-global");
