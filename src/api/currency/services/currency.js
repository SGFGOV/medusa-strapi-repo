"use strict";
const handleError = require("../../../utils/utils").handleError;
const getFields = require("../../../utils/utils").getFields;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const uid = "api::currency.currency";
module.exports = createCoreService(uid, ({ strapi }) => ({
  async handleManyToOneRelation(currency) {
    try {
      const found = await strapi.services[uid].findOne({
        code: currency.code,
      });
      if (found) {
        return found.id;
      }

      const create = await strapi.entityService.create(uid, { data: currency });
      return create.id;
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
