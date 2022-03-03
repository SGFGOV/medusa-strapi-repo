'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product-collection.product-collection', ({ strapi }) => ({
  async handleManyToOneRelation(product_collection) {
    try {
      if (!product_collection.medusa_id) {
        product_collection.medusa_id = product_collection.id;
        delete product_collection.id;
      }

      const found = await strapi.services['product-collection'].findOne({
        medusa_id: product_collection.medusa_id
      })
      if (found) {
        return found.id;
      }

      const create = await strapi.services['product-collection'].create(product_collection);
      return create.id;

    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
  }
}));
