'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::payment-provider.payment-provider', ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug('Syncing Payment Providers....');
    try {
      if (data && data.length) {
        for (let paymentProvider of data) {
          if (!paymentProvider.medusa_id) {
            paymentProvider.medusa_id = paymentProvider.id.toString();
            delete paymentProvider.id
          }

          const found = await strapi.query('payment-provider', '').findOne({ medusa_id: paymentProvider.medusa_id });
          if (found) {
            continue
          }

          const create = await strapi.services['payment-provider'].create(paymentProvider);
        }
      }
      strapi.log.info('Payment Providers synced');

      return true;
    } catch (e) {
      return false
    }
  },

  async handleManyToManyRelation(paymentProviders) {
    const strapiPaymentProvidersIds = [];

    try {
      for (let paymentProvider of paymentProviders) {
        paymentProvider.medusa_id = paymentProvider.id.toString();
        delete paymentProvider.id;

        const found = await strapi.query('payment-provider', '').findOne({
          medusa_id: paymentProvider.medusa_id
        })

        if (found) {
          strapiPaymentProvidersIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.services['payment-provider'].create(paymentProvider);
        strapiPaymentProvidersIds.push({ id: create.id });
      }
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
    return strapiPaymentProvidersIds;
  }
}));
