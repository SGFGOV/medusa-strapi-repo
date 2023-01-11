"use strict";
const handleError = require("../../../utils/utils").handleError;
const getFields = require("../../../utils/utils").getFields;
/*
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const uid = "api::region.region";
async function createOrUpdateRegionAfterDelegation(
  region,
  strapi,
  action = "create"
) {
  const {
    currency,
    countries,
    payment_providers,
    fulfillment_providers,
    ...payload
  } = region;

  if (currency) {
    payload.currency = await strapi
      .service("api::currency.currency")
      .handleManyToOneRelation(currency);
  }

  if (countries && countries.length) {
    payload.countries = await strapi
      .service("api::country.country")
      .handleOneToManyRelation(countries, "region");
  }

  if (payment_providers && payment_providers.length) {
    payload.payment_providers = await strapi
      .service("api::payment-provider.payment-provider")
      .handleManyToManyRelation(payment_providers, "region");
  }

  if (fulfillment_providers && fulfillment_providers.length) {
    payload.fulfillment_providers = await strapi
      .service("api::fulfillment-provider.fulfillment-provider")
      .handleManyToManyRelation(fulfillment_providers, "region");
  }

  if (action === "update") {
    const exists = await strapi.services[uid].findOne({
      medusa_id: region.medusa_id,
    });
    const update = await strapi.services[uid].update(exists.id, {
      data: payload,
    });
    strapi.log.info(update);
    return update.id;
  }

  const create = await strapi.entityService.create(uid, {
    data: payload,
  });
  return create.id;
}

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(uid, ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug("Syncing Region....");
    try {
      if (data && data.length) {
        for (const region of data) {
          region.medusa_id = region.id.toString();
          delete region.id;

          const found = await strapi.services[uid].findOne({
            medusa_id: region.medusa_id,
          });
          if (found) {
            continue;
          }

          const regionStrapiId = await createOrUpdateRegionAfterDelegation(
            region,
            strapi
          );
          if (regionStrapiId) {
            strapi.log.info("Region created");
          }
        }
      }
      strapi.log.info("Regions synced");
      return true;
    } catch (e) {
      handleError(strapi, e);
      strapi.log.error(JSON.stringify(e));
      return false;
    }
  },

  // Many "X" to One "region"
  async handleManyToOneRelation(region, caller) {
    try {
      region.medusa_id = region.id.toString();
      delete region.id;

      const found = await strapi.services[uid].findOne({
        medusa_id: region.medusa_id,
      });
      if (found) {
        return found.id;
      }

      return await createOrUpdateRegionAfterDelegation(region, strapi);
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
  },

  async updateWithRelations(region) {
    try {
      region.medusa_id = region.id.toString();
      delete region.id;

      return await createOrUpdateRegionAfterDelegation(
        region,
        strapi,
        "update"
      );
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },

  async createWithRelations(region) {
    try {
      if (!region.medusa_id) {
        region.medusa_id = region.id.toString();
        delete region.id;
      }
      return await createOrUpdateRegionAfterDelegation(region, strapi);
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },
  async findOne(params = {}) {
    const fields = getFields(__filename, __dirname);
    let filters = {};
    if (params.medusa_id) {
      filters = {
        ...params,
      };
    } else if (params.region_id) {
      filters = {
        medusa_id: params.region_id,
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
