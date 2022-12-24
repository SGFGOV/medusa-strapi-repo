'use strict';

/*
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
async function createFulfillmentProviderAfterDelegation(fulfillmentProvider,strapi) {
  const create = await strapi.entityService.create('api::fulfillment-provider.fulfillment-provider', { data: fulfillmentProvider });
  return create.id;
}

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::fulfillment-provider.fulfillment-provider', ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug('Syncing Fulfillment Providers....');
    try {
      if (data && data.length) {
        for (const fulfillmentProvider of data) {
          if (!fulfillmentProvider.medusa_id) {
            fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
            delete fulfillmentProvider.id
          }

          const found = await strapi.db.query('api::fulfillment-provider.fulfillment-provider').findOne({ medusa_id: fulfillmentProvider.medusa_id });
          if (found) {
            continue
          }

          const create = await strapi.entityService.create('api::fulfillment-provider.fulfillment-provider', { data: fulfillmentProvider });
          if(create)
          {
            strapi.log.info("crated fulfillment provider")
          }
        }
      }
      strapi.log.info('Fulfillment Providers synced');
      return true;
    } catch (e) {
      return false
    }
  },

  async handleManyToManyRelation(fulfillmentProviders) {
    const strapiFulfillmentProvidersIds = [];

    try {
      for (const fulfillmentProvider of fulfillmentProviders) {
        fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
        delete fulfillmentProvider.id;

        const found = await strapi.db.query('api::fulfillment-provider.fulfillment-provider').findOne({
          medusa_id: fulfillmentProvider.medusa_id
        })

        if (found) {
          strapiFulfillmentProvidersIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.entityService.create('api::fulfillment-provider.fulfillment-provider', { data: fulfillmentProvider });
        strapiFulfillmentProvidersIds.push({ id: create.id });
      }
    } catch (e) {
      strapi.log.error(JSON.stringify(e));
      throw new Error('Delegated creation failed');
    }
    return strapiFulfillmentProvidersIds;
  },

  async handleManyToOneRelation(fulfillmentProvider) {
    try {
      fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
      delete fulfillmentProvider.id;

      const found = await strapi.db.query('api::fulfillment-provider.fulfillment-provider').findOne({ medusa_id: fulfillmentProvider.medusa_id });
      if (found) {
        return found.id;
      }

      const fulfillmentProviderStrapiId = await createFulfillmentProviderAfterDelegation(fulfillmentProvider,strapi);
      return fulfillmentProviderStrapiId;
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
    return (await strapi.entityService.findMany('api::fulfillment-provider.fulfillment-provider', {
      fields,filters
    }))[0];
  }
}));
