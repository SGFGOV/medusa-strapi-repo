'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
async function createOrUpdateRegionAfterDelegation(region, action = 'create') {
  const { currency, countries, payment_providers, fulfillment_providers, ...payload } = region

  if (currency) {
    payload.currency = await strapi.services.currency.handleManyToOneRelation(currency);
  }

  if (countries && countries.length) {
    payload.countries = await strapi.services.country.handleOneToManyRelation(countries, 'region');
  }

  if (payment_providers && payment_providers.length) {
    payload.payment_providers = await strapi.services['payment-provider'].handleManyToManyRelation(payment_providers, 'region');
  }

  if (fulfillment_providers && fulfillment_providers.length) {
    payload.fulfillment_providers = await strapi.services['fulfillment-provider'].handleManyToManyRelation(fulfillment_providers, 'region');
  }

  if (action === 'update') {
    const update = await strapi.services.region.update({ medusa_id: region.medusa_id }, payload);
    console.log(update);
    return update.id;
  }

  const create = await strapi.services.region.create(payload);
  return create.id;
}

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::region.region', ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug('Syncing Region....');
    try {
      if (data && data.length) {
        for (let region of data) {
          region.medusa_id = region.id.toString();
          delete region.id;

          const found = await strapi.query('region', '').findOne({ medusa_id: region.medusa_id });
          if (found) {
            continue;
          }

          const regionStrapiId = await createOrUpdateRegionAfterDelegation(region);
        }
      }
      strapi.log.info('Regions synced');
      return true;
    } catch (e) {
      console.log(e);
      return false
    }
  },

  //Many "X" to One "region"
  async handleManyToOneRelation(region, caller) {
    try {
      region.medusa_id = region.id.toString();
      delete region.id;

      const found = await strapi.query('region', '').findOne({ medusa_id: region.medusa_id });
      if (found) {
        return found.id;
      }

      return await createOrUpdateRegionAfterDelegation(region);
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
  },

  async updateWithRelations(region) {
    try {
      region.medusa_id = region.id.toString();
      delete region.id;

      return await createOrUpdateRegionAfterDelegation(region, 'update');
    } catch (e) {
      console.log('Some error occurred while updating region \n', e);
      return false;
    }
  },

  async createWithRelations(region) {
    try {
      region.medusa_id = region.id.toString();
      delete region.id;

      return await createOrUpdateRegionAfterDelegation(region);
    } catch (e) {
      console.log('Some error occurred while creating region \n', e);
      return false;
    }
  }
}));
