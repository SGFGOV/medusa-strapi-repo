'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product-metafield.product-metafield', ({ strapi }) => ({
  async handleManyToOneRelation(product_metafield) {
    try {
      if (!product_metafield.medusa_id) {
        product_metafield.medusa_id = product_metafield.id;
        delete product_metafield.id;
      }

      const found = await strapi.service('api::product-metafield.product-metafield').findOne({
        medusa_id: product_metafield.medusa_id
      })
      if (found) {
        return found.id;
      }

      const create = await strapi.entityService.create('api::product-metafield.product-metafield', { data: product_metafield });
      return create.id;

    } catch (e) {
      strapi.log.error(e);
      throw new Error('Delegated creation failed');
    }
  },

  async findOne(params = {}) {
    const fields = ["id","value"]
    const filters = {
      ...params
    }
    return (await strapi.entityService.findMany('api::product-metafield.product-metafield', {
      fields,filters
    }))[0];
  }
}));
