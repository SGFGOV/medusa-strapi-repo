'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::currency.currency', ({ strapi }) => ({
  async handleManyToOneRelation(currency) {
    try {
      const found = await strapi.db.query('api::currency.currency').findOne({
        where: {code: currency.code}
      });
      if (found) {
        return found.id;
      }

      const create = await strapi.entityService.create('api::currency.currency', { data: currency });
      return create.id;
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }

  }
}));
