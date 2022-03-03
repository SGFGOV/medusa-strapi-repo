'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product-option.product-option', ({ strapi }) => ({
  async handleOneToManyRelation(product_options, forceUpdate = false) {
    const productOptionsStrapiIds = [];
    if (product_options && product_options.length) {
      for (let product_option of product_options) {
        try {
          if (!product_option.medusa_id) {
            product_option.medusa_id = product_option.id;
            delete product_option.id;
          }

          const found = await strapi.services['product-option'].findOne({
            medusa_id: product_option.medusa_id
          })
          if (found) {

            if (forceUpdate) {
              const update = await strapi.query('product-option', '').update({
                medusa_id: product_option.medusa_id
              }, {
                title: product_option.title,
                metadata: product_option.metadata
              });
              if (update) {
                productOptionsStrapiIds.push({ id: update.id });
                continue;
              }
            }

            productOptionsStrapiIds.push({ id: found.id });
            continue
          }

          const create = await strapi.services['product-option'].create(product_option);
          productOptionsStrapiIds.push({ id: create.id });
        } catch (e) {
          console.log(e);
          throw new Error('Delegated creation failed');
        }
      }
    }

    return productOptionsStrapiIds;
  }
}));
