"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::image.image", ({ strapi }) => ({
  async handleManyToManyRelation(images) {
    const strapiImagesIds = [];

    try {
      for (const image of images) {
        image.medusa_id = image.id.toString();
        delete image.id;

        const found = await strapi.services["api::image.image"].findOne({
          medusa_id: image.medusa_id,
        });

        if (found) {
          strapiImagesIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.entityService.create("api::image.image", {
          data: image,
        });
        strapiImagesIds.push({ id: create.id });
      }
    } catch (e) {
      strapi.log.error(JSON.stringify(e));
      throw new Error("Delegated creation failed");
    }
    return strapiImagesIds;
  },
  async findOne(params = {}) {
    const fields = ["id"];
    const filters = {
      ...params,
    };
    return (
      await strapi.entityService.findMany("api::image.image", {
        fields,
        filters,
      })
    )[0];
  },
}));
