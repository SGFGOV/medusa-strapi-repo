"use strict";

const { createNestedEntity } = require("../../../utils/utils");

const handleError = require("../../../utils/utils").handleError;
const getStrapiDataByMedusaId =
  require("../../../utils/utils").getStrapiDataByMedusaId;
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

          const medusa_id = paymentProvider.medusa_id;
          const found = await getStrapiDataByMedusaId(uid, strapi, medusa_id, [
            "id",
            "medusa_id",
          ]);
          if (found) {
            continue;
          }
          try {
            const paymentProviderEntity = await createNestedEntity(
              uid,
              strapi,
              paymentProvider
            );
            if (paymentProviderEntity) {
              strapi.log.info("payment provider created");
            }
          } catch (e) {
            strapi.log.error(
              `unable to sync payment provider ${uid} ${paymentProvider}`
            );
          }
        }
        strapi.log.info("Payment Providers synced");

        return true;
      }
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },
  /*
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
  /* async findOne(params = {}) {
  const fields = getFields(__filename, __dirname);
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
},*/
  async delete(strapi_id, params = {}) {
    return await strapi.entityService.delete(uid, strapi_id, params);
  },
}));
