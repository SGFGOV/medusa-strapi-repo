'use strict';
const handleError = require('../../../utils/utils').handleError;
const getFields = require('../../../utils/utils').getFields;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const uid = 'api::country.country';
module.exports = createCoreService(uid, ({ strapi }) => ({
	/*
  async handleOneToManyRelation(countries, parent) {
    const countriesStrapiIds = [];

    try {
      if (countries && countries.length) {
        for (const country of countries) {
          country.medusa_id = country.id.toString();
          delete country.id;

          if (parent === "region") {
            delete country.region_id;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: country.medusa_id,
          });
          if (found) {
            countriesStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.entityService.create(uid, {
            data: country,
          });
          countriesStrapiIds.push({ id: create.id });
        }
      }
      return countriesStrapiIds;
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
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
	/* async delete(strapi_id, params = {}) {
    return await strapi.entityService.delete(uid, strapi_id, params);
  },*/
}));
