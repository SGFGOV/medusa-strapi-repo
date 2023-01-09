const { createCoreService } = require("@strapi/strapi").factories;

function createGenericApiService(api) {
  const apiName = `api::${api}.${api}`;
  return createCoreService(apiName, ({ strapi }) => ({
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

            const found = await strapi.services[apiName].findOne({
              medusa_id: country.medusa_id,
            });
            if (found) {
              countriesStrapiIds.push({ id: found.id });
              continue;
            }

            const create = await strapi.entityService.create(apiName, {
              data: country,
            });
            countriesStrapiIds.push({ id: create.id });
          }
        }
        return countriesStrapiIds;
      } catch (e) {
        strapi.log.error(JSON.stringify(e));
        throw new Error("Delegated creation failed");
      }
    },
    async findOne(params = {}) {
      const fields = ["id"];
      const filters = {
        ...params,
      };
      return (
        await strapi.entityService.findMany(apiName, {
          fields,
          filters,
        })
      )[0];
    },
  }));
}

module.exports = {
  createGenericApiService: createGenericApiService,
};


