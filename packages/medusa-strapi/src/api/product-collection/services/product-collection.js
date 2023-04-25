'use strict';
const handleError = require('../../../utils/utils').handleError;
// const handleError = require("../../../utils/utils").handleError;
const getStrapiDataByMedusaId = require('../../../utils/utils').getStrapiDataByMedusaId;

/**
 *
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const uid = 'api::product-collection.product-collection';
module.exports = createCoreService(uid, ({ strapi }) => ({
	async bootstrap(data) {
		strapi.log.debug('Syncing Region....');
		try {
			if (data && data.length) {
				for (const productCollection of data) {
					if (!productCollection.medusa_id) {
						productCollection.medusa_id = productCollection.id.toString();
					}

					const found = await getStrapiDataByMedusaId(uid, strapi, productCollection.medusa_id, [
						'id',
						'medusa_id',
					]);

					if (found) {
						continue;
					}
					try {
						const productCollectionStrapi = await createNestedEntity(uid, strapi, productCollection);
						if (productCollectionStrapi.id) {
							strapi.log.info(
								`Collection created :` +
									` ${productCollectionStrapi.id} ${productCollectionStrapi.name}`
							);
						}
					} catch (e) {
						strapi.log.error(`unable to sync region ${uid} ${productCollection}`);
					}
				}
			}
			strapi.log.info('Regions synced');
			return true;
		} catch (e) {
			handleError(strapi, e);
			strapi.log.error(JSON.stringify(e));
			return false;
		}
	} /*
  async handleManyToOneRelation(product_collection) {
    try {
      if (!product_collection.medusa_id) {
        product_collection.medusa_id = product_collection.id;
        delete product_collection.id;
      }

      const found = await strapi.service(uid).findOne({
        medusa_id: product_collection.medusa_id,
      });
      if (found) {
        return found.id;
      }

      const create = await strapi.entityService.create(uid, {
        data: product_collection,
      });
      return create.id;
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
  },
  /*async findOne(params = {}) {
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
},*/,
	async delete(strapi_id, params = {}) {
		return await strapi.entityService.delete(uid, strapi_id, params);
	},
}));
