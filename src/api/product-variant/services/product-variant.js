'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

async function createOrUpdateProductVariantAfterDelegation(productVariant, action = 'create', forceUpdateRelation = false) {
  const { 'prices': money_amounts, 'options': product_option_values, ...payload } = productVariant;
  if (money_amounts) {
    payload.money_amounts = await strapi.services['money-amount'].handleOneToManyRelation(money_amounts, forceUpdateRelation);
  }

  if (product_option_values) {
    payload.product_option_values = await strapi.services['product-option-value'].handleOneToManyRelation(product_option_values, forceUpdateRelation);
  }

  const exists = await strapi.query('product-variant', '').findOne({
    medusa_id: productVariant.medusa_id
  });

  if (action === 'update' || exists) {
    const update = await strapi.services['product-variant'].update({ medusa_id: productVariant.medusa_id }, payload);
    return update.id;
  }


  const create = await strapi.services['product-variant'].create(payload);
  return create.id;
}

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product-variant.product-variant', ({ strapi }) => ({
  async handleOneToManyRelation(productVariants, caller, forceUpdate) {
    const productVariantsIds = [];

    try {
      if (productVariants && productVariants.length) {
        for (let productVariant of productVariants) {
          if (productVariant.id) {
            productVariant.medusa_id = productVariant.id;
            delete productVariant.id;
          }

          if (caller === 'product') {
            delete productVariant.product_id;
            delete productVariant.product;
          }

          const found = await strapi.query('product-variant', '').findOne({ medusa_id: productVariant.medusa_id });
          if (found) {
            if (forceUpdate) {
              const update = await this.updateWithRelations(productVariant);
              productVariantsIds.push({ id: update });
              continue;
            }
            productVariantsIds.push({ id: found.id });
            continue;
          }

          const create = await createOrUpdateProductVariantAfterDelegation(productVariant);
          productVariantsIds.push({ id: create });
        }
      }

      return productVariantsIds
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
  },

  async createWithRelations(variant) {
    try {
      if (variant.id) {
        variant.medusa_id = variant.id.toString();
        delete variant.id;
      }

      return await createOrUpdateProductVariantAfterDelegation(variant);
    } catch (e) {
      console.log('Some error occurred while creating product variant \n', e);
      return false;
    }
  },

  async updateWithRelations(variant) {
    try {
      if (variant.id) {
        variant.medusa_id = variant.id.toString();
        delete variant.id;
      }

      return await createOrUpdateProductVariantAfterDelegation(variant, 'update', true);
    } catch (e) {
      console.log('Some error occurred while updating product variant \n', e);
      return false;
    }
  }
}));
