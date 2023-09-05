'use strict';
const handleError = require('../../../utils/utils').handleError;
const getFields = require('../../../utils/utils').getFields;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const uid = 'api::product-option-value.product-option-value';
module.exports = createCoreService(uid, ({ strapi }) => ({
	/*
  async handleOneToManyRelation(product_option_values, forceUpdate) {
    const productOptionValuesStrapiIds = [];
    if (product_option_values && product_option_values.length) {
      for (const product_option_value of product_option_values) {
        try {
          if (!product_option_value.medusa_id) {
            product_option_value.medusa_id = product_option_value.id;
            delete product_option_value.id;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: product_option_value.medusa_id,
          });
          if (found) {
            if (forceUpdate) {
              const update = await strapi.services[uid].update(found.id, {
                data: {
                  medusa_id: product_option_value.medusa_id,
                  value: product_option_value.value,
                },
              });
              if (update) {
                productOptionValuesStrapiIds.push({ id: update.id });
                continue;
              }
            }

            productOptionValuesStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.entityService.create(uid, {
            data: product_option_value,
          });
          productOptionValuesStrapiIds.push({ id: create.id });
        } catch (e) {
          handleError(strapi, e);
          throw new Error("Delegated creation failed");
        }
      }
    }

    return productOptionValuesStrapiIds;
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
