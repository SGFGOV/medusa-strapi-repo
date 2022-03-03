'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product-tag.product-tag', ({ strapi }) => ({
  async handleManyToManyRelation(product_tags) {
    const strapiProductTagsIds = [];

    try {
      for (let product_tag of product_tags) {
        product_tag.medusa_id = product_tag.id.toString();
        delete product_tag.id;

        const found = await strapi.query('product-tag', '').findOne({
          medusa_id: product_tag.medusa_id
        })

        if (found) {
          strapiProductTagsIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.services['product-tag'].create(product_tag);
        strapiProductTagsIds.push({ id: create.id });
      }
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
    return strapiProductTagsIds;
  }
}));
