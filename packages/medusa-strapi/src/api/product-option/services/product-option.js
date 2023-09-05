'use strict';
const handleError = require('../../../utils/utils').handleError;
const getFields = require('../../../utils/utils').getFields;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const uid = 'api::product-option.product-option';
module.exports = createCoreService(uid, ({ strapi }) => ({
	/*
  async handleOneToManyRelation(product_options, forceUpdate = false) {
    const productOptionsStrapiIds = [];
    if (product_options && product_options.length) {
      for (const product_option of product_options) {
        try {
          if (!product_option.medusa_id) {
            product_option.medusa_id = product_option.id;
            delete product_option.id;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: product_option.medusa_id,
          });
          if (found) {
            if (forceUpdate) {
              const update = await strapi.services[uid].update(found.id, {
                data: {
                  medusa_id: product_option.medusa_id,
                  title: product_option.title,
                  metadata: product_option.metadata,
                },
              });
              if (update) {
                productOptionsStrapiIds.push({ id: update.id });
                continue;
              }
            }

            productOptionsStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.entityService.create(uid, {
            data: product_option,
          });
          productOptionsStrapiIds.push({ id: create.id });
        } catch (e) {
          handleError(strapi, e);
          throw new Error("Delegated creation failed");
        }
      }
    }

    return productOptionsStrapiIds;
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
