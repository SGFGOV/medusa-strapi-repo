"use strict";
const handleError = require("../../../utils/utils").handleError;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
  "api::product-document.product-document",
  ({ strapi }) => ({
    async handleManyToOneRelation(product_document) {
      try {
        if (!product_document.medusa_id) {
          product_document.medusa_id = product_document.id;
          delete product_document.id;
        }

        const found = await strapi
          .service("api::product-document.product-document")
          .findOne({
            medusa_id: product_document.medusa_id,
          });
        if (found) {
          return found.id;
        }

        const create = await strapi.entityService.create(
          "api::product-document.product-document",
          { data: product_document }
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
          "api::product-document.product-document",
          {
            fields,
            filters,
          }
        )
      )[0];
    },
  })
);
