'use strict';
const handleError = require('../../../utils/utils').handleError;
const getFields = require('../../../utils/utils').getFields;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const uid = 'api::product-legal.product-legal';
module.exports = createCoreService(uid, ({ strapi }) => ({
	/*
  async handleManyToOneRelation(product_legal) {
    try {
      if (!product_legal.medusa_id) {
        product_legal.medusa_id = product_legal.id;
        delete product_legal.id;
      }

      const found = await strapi.service(uid).findOne({
        medusa_id: product_legal.medusa_id,
      });
      if (found) {
        return found.id;
      }

      const create = await strapi.entityService.create(uid, {
        data: product_legal,
      });
      return create.id;
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
  },

  /*async findOne(params = {}) {
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
  },*/
	async delete(strapi_id, params = {}) {
		return await strapi.entityService.delete(uid, strapi_id, params);
	},
}));
