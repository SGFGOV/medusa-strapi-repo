'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::currency.currency', ({ strapi }) => ({
  async handleManyToOneRelation(currency) {
    try {
      const found = await strapi.services['api::currency.currency'].findOne({
        code: currency.code 
      });
if (found) {
  return found.id;
}

const create = await strapi.entityService.create('api::currency.currency', { data: currency });
return create.id;
    } catch (e) {
  strapi.log.error(JSON.stringify(e));
  throw new Error('Delegated creation failed');
}

  },

  async findOne(params = {}) {
  const fields = ["id"]
  const filters = {
    ...params
  }
  return (await strapi.entityService.findMany('api::currency.currency', {
    fields, filters
  }))[0];
}
  
}));
