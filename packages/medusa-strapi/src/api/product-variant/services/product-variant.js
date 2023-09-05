'use strict';
const handleError = require('../../../utils/utils').handleError;
const getFields = require('../../../utils/utils').getFields;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const uid = 'api::product-variant.product-variant';
async function createOrUpdateProductVariantAfterDelegation(
	productVariant,
	strapi,
	action = 'create',
	forceUpdateRelation = false
) {
	const { prices: money_amounts, options: product_option_values, ...payload } = productVariant;
	if (money_amounts) {
		payload.money_amounts = await strapi
			.service('api::money-amount.money-amount')
			.handleOneToManyRelation(money_amounts, forceUpdateRelation);
	}

	if (product_option_values) {
		payload.product_option_values = await strapi
			.service('api::product-option-value.product-option-value')
			.handleOneToManyRelation(product_option_values, forceUpdateRelation);
	}

	const exists = await strapi.services[uid].findOne({
		medusa_id: productVariant.medusa_id,
	});

	if (action === 'update' || exists) {
		const update = await strapi.services[uid].update(exists.id, {
			data: payload,
		});
		return update.id;
	}

	const create = await strapi.entityService.create(uid, { data: payload });
	return create.id;
}

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(uid, ({ strapi }) => ({
	/*
  async handleOneToManyRelation(productVariants, caller, forceUpdate) {
    const productVariantsIds = [];

    try {
      if (productVariants && productVariants.length) {
        for (const productVariant of productVariants) {
          if (productVariant.id) {
            productVariant.medusa_id = productVariant.id;
            delete productVariant.id;
          }

          if (caller === "product") {
            delete productVariant.product_id;
            delete productVariant.product;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: productVariant.medusa_id,
          });
          if (found) {
            if (forceUpdate) {
              const update = await this.updateWithRelations(productVariant);
              productVariantsIds.push({ id: update });
              continue;
            }
            productVariantsIds.push({ id: found.id });
            continue;
          }

          const create = await createOrUpdateProductVariantAfterDelegation(
            productVariant,
            strapi
          );
          productVariantsIds.push({ id: create });
        }
      }

      return productVariantsIds;
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
  },

  async createWithRelations(variant) {
    try {
      if (variant.id) {
        variant.medusa_id = variant.id.toString();
        delete variant.id;
      }

      return await createOrUpdateProductVariantAfterDelegation(variant, strapi);
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },

  async updateWithRelations(variant) {
    try {
      if (variant.id) {
        variant.medusa_id = variant.id.toString();
        delete variant.id;
      }

      return await createOrUpdateProductVariantAfterDelegation(
        variant,
        strapi,
        "update",
        true
      );
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },
  /*async findOne(params = {}) {
    const fields = getFields(__filename, __dirname);
    let filters = {};
    if (params.medusa_id) {
      filters = {
        ...params,
      };
    } else if (params.product_variant_id) {
      filters = {
        medusa_id: params.product_variant_id,
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
