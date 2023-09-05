'use strict';
const handleError = require('../../../utils/utils').handleError;
const getFields = require('../../../utils/utils').getFields;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const uid = 'api::product-tag.product-tag';
module.exports = createCoreService(uid, ({ strapi }) => ({
	/*
  async handleManyToManyRelation(product_tags) {
    const strapiProductTagsIds = [];

    try {
      for (const product_tag of product_tags) {
        product_tag.medusa_id = product_tag.id.toString();
        delete product_tag.id;

        const found = await strapi.services[uid].findOne({
          medusa_id: product_tag.medusa_id,
        });

        if (found) {
          strapiProductTagsIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.entityService.create(uid, {
          data: product_tag,
        });
        strapiProductTagsIds.push({ id: create.id });
      }
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
    return strapiProductTagsIds;
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
