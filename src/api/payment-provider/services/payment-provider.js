"use strict";
const handleError = require("../../../utils/utils").handleError;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const uid = "api::payment-provider.payment-provider";
module.exports = createCoreService(uid, ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug("Syncing Payment Providers....");
    try {
      if (data && data.length) {
        for (const paymentProvider of data) {
          if (!paymentProvider.medusa_id) {
            paymentProvider.medusa_id = paymentProvider.id.toString();
            delete paymentProvider.id;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: paymentProvider.medusa_id,
          });
          if (found) {
            continue;
          }

          const createSuccesful = await strapi.entityService.create(uid, {
            data: paymentProvider,
          });
          if (createSuccesful) {
            strapi.log.info("payment provider created");
          }
        }
      }
      strapi.log.info("Payment Providers synced");

      return true;
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },

  async handleManyToManyRelation(paymentProviders) {
    const strapiPaymentProvidersIds = [];

    try {
      for (const paymentProvider of paymentProviders) {
        paymentProvider.medusa_id = paymentProvider.id.toString();
        delete paymentProvider.id;

        const found = await strapi.services[uid].findOne({
          medusa_id: paymentProvider.medusa_id,
        });

        if (found) {
          strapiPaymentProvidersIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.entityService.create(uid, {
          data: paymentProvider,
        });
        strapiPaymentProvidersIds.push({ id: create.id });
      }
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
    return strapiPaymentProvidersIds;
  },
  async findOne(params = {}) {
    const fields = ["id"];
    let filters = {};
    if (params.medusa_id) {
      filters = {
        ...params,
      };
    } else {
      filters = {
        medusa_id: params,
      };
    }
    return (
      await strapi.entityService.findMany(uid, {
        fields,
        filters,
      })
    )[0];
  },
  async delete(medusa_id, params = {}) {
    const exists = await this.findOne(medusa_id);
    if (exists) {
      return strapi.entityService.delete(uid, exists.id, params);
    }
  },
}));
