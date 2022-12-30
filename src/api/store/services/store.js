'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::store.store', ({ strapi }) => ({
  async handleOneToManyRelation(stores, parent) {

    const storesStrapiIds = [];

    try {
      if (stores && stores.length) {
        for (const store of stores) {
          store.medusa_id = store.id.toString();
          delete store.id;

          if (parent === 'region') {
            delete store.region_id
          }

          const found = await strapi.services['api::store.store'].findOne({
            medusa_id: store.medusa_id
          });
if (found) {
  storesStrapiIds.push({ id: found.id });
  continue;
}

const create = await strapi.entityService.create('api::store.store', { data: store });
storesStrapiIds.push({ id: create.id });
        }
      }
return storesStrapiIds;
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
  return (await strapi.entityService.findMany('api::store.store', {
    fields, filters
  }))[0];
}
}));
