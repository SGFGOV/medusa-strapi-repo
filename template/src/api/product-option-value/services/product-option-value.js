'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product-option-value.product-option-value', ({ strapi }) => ({
  async handleOneToManyRelation(product_option_values, forceUpdate) {
    const productOptionValuesStrapiIds = [];
    if (product_option_values && product_option_values.length) {
      for (let product_option_value of product_option_values) {
        try {
          if (!product_option_value.medusa_id) {
            product_option_value.medusa_id = product_option_value.id;
            delete product_option_value.id;
          }

          const found = await strapi.services['product-option-value'].findOne({
            medusa_id: product_option_value.medusa_id
          })
          if (found) {

            if (forceUpdate) {
              const update = await strapi.query('product-option-value', '').update({
                medusa_id: product_option_value.medusa_id
              }, {
                value: product_option_value.value,
              });
              if (update) {
                productOptionValuesStrapiIds.push({ id: update.id });
                continue;
              }
            }

            productOptionValuesStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.services['product-option-value'].create(product_option_value);
          productOptionValuesStrapiIds.push({ id: create.id });
        } catch (e) {
          console.log(e.data.medusa_id);
          console.log(e);
          throw new Error('Delegated creation failed');
        }
      }
    }

    return productOptionValuesStrapiIds;
  }
}));
