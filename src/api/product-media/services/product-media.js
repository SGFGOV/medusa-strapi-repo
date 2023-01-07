"use strict";
const handleError = require("../../../utils/utils").handleError;
/**
 * Read the mediaation (https://strapi.io/mediaation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
  "api::product-media.product-media",
  ({ strapi }) => ({
    async handleManyToOneRelation(product_media) {
      try {
        if (!product_media.medusa_id) {
          product_media.medusa_id = product_media.id;
          delete product_media.id;
        }

        const found = await strapi
          .service("api::product-media.product-media")
          .findOne({
            medusa_id: product_media.medusa_id,
          });
        if (found) {
          return found.id;
        }

        const create = await strapi.entityService.create(
          "api::product-media.product-media",
          { data: product_media }
        );
        return create.id;
      } catch (e) {
        handleError(strapi, e);
        throw new Error("Delegated creation failed");
      }
    },

    async findOne(params = {}) {
      const fields = ["id", "value"];
      const filters = {
        ...params,
      };
      return (
        await strapi.entityService.findMany(
          "api::product-media.product-media",
          {
            fields,
            filters,
          }
        )
      )[0];
    },
  })
);
