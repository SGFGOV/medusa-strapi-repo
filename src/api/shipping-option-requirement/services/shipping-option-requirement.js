"use strict";
const handleError = require("../../../utils/utils").handleError;
const getFields = require("../../../utils/utils").getFields;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const uid = "api::shipping-option-requirement.shipping-option-requirement";
module.exports = createCoreService(uid, ({ strapi }) => ({
  async handleOneToManyRelation(shippingOptionRequirements) {
    const shippingOptionRequirementStrapiIds = [];
    try {
      if (shippingOptionRequirements && shippingOptionRequirements.length) {
        for (const shippingOptionRequirement of shippingOptionRequirements) {
          if (shippingOptionRequirement.id) {
            shippingOptionRequirement.medusa_id = shippingOptionRequirement.id;
            delete shippingOptionRequirement.id;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: shippingOptionRequirement.medusa_id,
          });
          if (found) {
            shippingOptionRequirementStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.entityService.create(uid, {
            data: shippingOptionRequirement,
          });
          shippingOptionRequirementStrapiIds.push({ id: create.id });
        }
      }
      return shippingOptionRequirementStrapiIds;
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
  },
  async findOne(params = {}) {
    const fields = getFields(__filename, __dirname);
    let filters = {};
    if (params.medusa_id) {
      filters = {
        ...params,
      };
    } else {
      filters = {
        medusa_id: params,
      };
    }
    return (
      await strapi.entityService.findMany(uid, {
        fields,
        filters,
      })
    )[0];
  },
  async delete(strapi_id, params = {}) {
    return await strapi.entityService.delete(uid, strapi_id, params);
  },
}));
