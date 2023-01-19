"use strict";

const { createNestedEntity } = require("../../../utils/utils");

const handleError = require("../../../utils/utils").handleError;
const getStrapiDataByMedusaId =
  require("../../../utils/utils").getStrapiDataByMedusaId;
/*
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const uid = "api::region.region";

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(uid, ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug("Syncing Region....");
    try {
      if (data && data.length) {
        for (const region of data) {
          if (!region.medusa_id) {
            region.medusa_id = region.id.toString();
          }

          const found = await getStrapiDataByMedusaId(
            uid,
            strapi,
            region.medusa_id,
            ["id", "medusa_id"]
          );

          if (found) {
            continue;
          }
          try {
            const regionStrapiId = await createNestedEntity(
              uid,
              strapi,
              region
            );
            if (regionStrapiId) {
              strapi.log.info(`Region created : ${regionStrapiId}`);
            }
          } catch (e) {
            strapi.log.error(`unable to sync region ${uid} ${region}`);
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
  /*
  // Many "X" to One "region"
  async handleManyToOneRelation(region) {
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
  /* async findOne(params = {}) {
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
  },*/
  async delete(strapi_id, params = {}) {
    return await strapi.entityService.delete(uid, strapi_id, params);
  },
}));
