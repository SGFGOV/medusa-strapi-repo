'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async handleManyToOneRelation(currency) {
    try {
      const found = await strapi.services.currency.findOne({
        code: currency.code
      });
      if (found) {
        return found.id;
      }

      const create = await strapi.services.currency.create(currency);
      return create.id;
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }

  }

};
