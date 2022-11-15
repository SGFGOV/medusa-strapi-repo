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

          const found = await strapi.db.query('api::product-option.product-option').findOne({
            where: {medusa_id: product_option.medusa_id}
          })
          if (found) {

            if (forceUpdate) {
              const update = await strapi.db.query('api::product-option.product-option').update({
                where: {medusa_id: product_option.medusa_id},
                data: {
                  title: product_option.title,
                  metadata: product_option.metadata
                }
              });
              if (update) {
                productOptionsStrapiIds.push({ id: update.id });
                continue;
              }
            }

            productOptionsStrapiIds.push({ id: found.id });
            continue
          }

          const create = await strapi.entityService.create('api::product-option.product-option', { data: product_option });
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
