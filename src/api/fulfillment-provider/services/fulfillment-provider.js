"use strict";
const handleError = require("../../../utils/utils").handleError;
const getFields = require("../../../utils/utils").getFields;
/*
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const uid = "api::fulfillment-provider.fulfillment-provider";
async function createFulfillmentProviderAfterDelegation(
  fulfillmentProvider,
  strapi
) {
  const create = await strapi.entityService.create(uid, {
    data: fulfillmentProvider,
  });
  return create.id;
}

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(uid, ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug("Syncing Fulfillment Providers....");
    try {
      if (data && data.length) {
        for (const fulfillmentProvider of data) {
          if (!fulfillmentProvider.medusa_id) {
            fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
            delete fulfillmentProvider.id;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: fulfillmentProvider.medusa_id,
          });
          if (found) {
            continue;
          }

          const create = await strapi.entityService.create(uid, {
            data: fulfillmentProvider,
          });
          if (create) {
            strapi.log.info("crated fulfillment provider");
          }
        }
      }
      strapi.log.info("Fulfillment Providers synced");
      return true;
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },

  async handleManyToManyRelation(fulfillmentProviders) {
    const strapiFulfillmentProvidersIds = [];

    try {
      for (const fulfillmentProvider of fulfillmentProviders) {
        fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
        delete fulfillmentProvider.id;

        const found = await strapi.services[uid].findOne({
          medusa_id: fulfillmentProvider.medusa_id,
        });

        if (found) {
          strapiFulfillmentProvidersIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.entityService.create(uid, {
          data: fulfillmentProvider,
        });
        strapiFulfillmentProvidersIds.push({ id: create.id });
      }
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
    return strapiFulfillmentProvidersIds;
  },

  async handleManyToOneRelation(fulfillmentProvider) {
    try {
      fulfillmentProvider.medusa_id = fulfillmentProvider.id.toString();
      delete fulfillmentProvider.id;

      const found = await strapi.services[uid].findOne({
        medusa_id: fulfillmentProvider.medusa_id,
      });
      if (found) {
        return found.id;
      }

      const fulfillmentProviderStrapiId =
        await createFulfillmentProviderAfterDelegation(
          fulfillmentProvider,
          strapi
        );
      return fulfillmentProviderStrapiId;
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
  },
  async findOne(params = {}) {
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
  },
  async delete(strapi_id, params = {}) {
    return await strapi.entityService.delete(uid, strapi_id, params);
  },
}));
