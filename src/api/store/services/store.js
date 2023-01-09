"use strict";

const handleError = require("../../../utils/utils").handleError;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const uid = "api::store.store";
module.exports = createCoreService(uid, ({ strapi }) => ({
  async handleManyToOneRelation(store) {
    try {
      const found = await strapi.services[uid].findOne({
        medusa_id: store.id,
      });
      if (found) {
        return found.id;
      }

      const create = await strapi.entityService.create(uid, { data: store });
      return create.id;
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
  },
  async findOne(params = {}) {
    const fields = ["id"];
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
  /* async create(params = {}) {
    const { data } = params;

    /* if (hasDraftAndPublish(contentType)) {
      setPublishedAt(data);
    }

    return await strapi.entityService.create(uid, {
      ...params,
      data: { ...data, populate: data },
    });
  },*/
}));
