'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
async function createFulfillmentProviderAfterDelegation(fulfillmentProvider) {
  const create = await strapi.services['fulfillment-provider'].create(fulfillmentProvider);
  return create.id;
}

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::fulfillment-provider.fulfillment-provider', ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug('Syncing Fulfillment Providers....');
    try {
      if (data && data.length) {
        for (let fulfillmentProvider of data) {
          if (!fulfillmentProvider.medusa_id) {
            fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
            delete fulfillmentProvider.id
          }

          const found = await strapi.query('fulfillment-provider', '').findOne({ medusa_id: fulfillmentProvider.medusa_id });
          if (found) {
            continue
          }

          const create = await strapi.services['fulfillment-provider'].create(fulfillmentProvider);
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
      for (let fulfillmentProvider of fulfillmentProviders) {
        fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
        delete fulfillmentProvider.id;

        const found = await strapi.query('fulfillment-provider', '').findOne({
          medusa_id: fulfillmentProvider.medusa_id
        })

        if (found) {
          strapiFulfillmentProvidersIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.services['fulfillment-provider'].create(fulfillmentProvider);
        strapiFulfillmentProvidersIds.push({ id: create.id });
      }
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
    return strapiFulfillmentProvidersIds;
  },

  async handleManyToOneRelation(fulfillmentProvider) {
    try {
      fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
      delete fulfillmentProvider.id;

      const found = await strapi.query('fulfillment-provider', '').findOne({ medusa_id: fulfillmentProvider.medusa_id });
      if (found) {
        return found.id;
      }

      const fulfillmentProviderStrapiId = await createFulfillmentProviderAfterDelegation(fulfillmentProvider);
      return fulfillmentProviderStrapiId;
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
  }
}));
