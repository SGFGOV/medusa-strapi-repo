"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
  "api::payment-provider.payment-provider",
  ({ strapi }) => ({
    async bootstrap(data) {
      strapi.log.debug("Syncing Payment Providers....");
      try {
        if (data && data.length) {
          for (const paymentProvider of data) {
            if (!paymentProvider.medusa_id) {
              paymentProvider.medusa_id = paymentProvider.id.toString();
              delete paymentProvider.id;
            }

            const found = await strapi.services[
              "api::payment-provider.payment-provider"
            ].findOne({ medusa_id: paymentProvider.medusa_id });
            if (found) {
              continue;
            }

            const createSuccesful = await strapi.entityService.create(
              "api::payment-provider.payment-provider",
              { data: paymentProvider }
            );
            if (createSuccesful) {
              strapi.log.info("payment provider created");
            }
          }
        }
        strapi.log.info("Payment Providers synced");

        return true;
      } catch (e) {
        return false;
      }
    },

    async handleManyToManyRelation(paymentProviders) {
      const strapiPaymentProvidersIds = [];

      try {
        for (const paymentProvider of paymentProviders) {
          paymentProvider.medusa_id = paymentProvider.id.toString();
          delete paymentProvider.id;

          const found = await strapi.services[
            "api::payment-provider.payment-provider"
          ].findOne({
            medusa_id: paymentProvider.medusa_id,
          });

          if (found) {
            strapiPaymentProvidersIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.entityService.create(
            "api::payment-provider.payment-provider",
            { data: paymentProvider }
          );
          strapiPaymentProvidersIds.push({ id: create.id });
        }
      } catch (e) {
        strapi.log.error(JSON.stringify(e));
        throw new Error("Delegated creation failed");
      }
      return strapiPaymentProvidersIds;
    },
    async findOne(params = {}) {
      const fields = ["id"];
      const filters = {
        ...params,
      };
      return (
        await strapi.entityService.findMany(
          "api::product-collection.product-collection",
          {
            fields,
            filters,
          }
        )
      )[0];
    },
  })
);
