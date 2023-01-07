"use strict";
const handleError = require("../../../utils/utils").handleError;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
  "api::product-legal.product-legal",
  ({ strapi }) => ({
    async handleManyToOneRelation(product_legal) {
      try {
        if (!product_legal.medusa_id) {
          product_legal.medusa_id = product_legal.id;
          delete product_legal.id;
        }

        const found = await strapi
          .service("api::product-legal.product-legal")
          .findOne({
            medusa_id: product_legal.medusa_id,
          });
        if (found) {
          return found.id;
        }

        const create = await strapi.entityService.create(
          "api::product-legal.product-legal",
          { data: product_legal }
        );
        return create.id;
      } catch (e) {
        handleError(strapi, e);
        throw new Error("Delegated creation failed");
      }
    },

    async findOne(params = {}) {
      const fields = ["id", "value", ""];
      const filters = {
        ...params,
      };
      return (
        await strapi.entityService.findMany(
          "api::product-legal.product-legal",
          {
            fields,
            filters,
          }
        )
      )[0];
    },
  })
);
