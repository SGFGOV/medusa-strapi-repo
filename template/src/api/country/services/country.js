'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::country.country', ({ strapi }) => ({
  async handleOneToManyRelation(countries, parent) {

    const countriesStrapiIds = [];

    try {
      if (countries && countries.length) {
        for (let country of countries) {
          country.medusa_id = country.id.toString();
          delete country.id;

          if (parent === 'region') {
            delete country.region_id
          }

          const found = await strapi.query('country', '').findOne({
            medusa_id: country.medusa_id
          });
          if (found) {
            countriesStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.services.country.create(country);
          countriesStrapiIds.push({ id: create.id });
        }
      }
      return countriesStrapiIds;
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }

  }
}));
