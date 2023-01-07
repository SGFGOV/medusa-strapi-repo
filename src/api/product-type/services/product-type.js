"use strict";
const handleError = require("../../../utils/utils").handleError;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
  "api::product-type.product-type",
  ({ strapi }) => ({
    async handleManyToOneRelation(product_type) {
      try {
        if (!product_type.medusa_id) {
          product_type.medusa_id = product_type.id;
          delete product_type.id;
        }

        const found = await strapi
          .service("api::product-type.product-type")
          .findOne({
            medusa_id: product_type.medusa_id,
          });
        if (found) {
          return found.id;
        }

        const create = await strapi.entityService.create(
          "api::product-type.product-type",
          { data: product_type }
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
        await strapi.entityService.findMany("api::product-type.product-type", {
          fields,
          filters,
        })
      )[0];
    },
  })
);
