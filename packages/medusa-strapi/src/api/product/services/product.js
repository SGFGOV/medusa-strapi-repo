'use strict';

const { createNestedEntity } = require('../../../utils/utils');

const handleError = require('../../../utils/utils').handleError;
const getStrapiDataByMedusaId = require('../../../utils/utils').getStrapiDataByMedusaId;

/*
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const uid = 'api::product.product';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService(uid, ({ strapi }) => ({
	async syncProduct(product) {
		if (!product.medusa_id) {
			product.medusa_id = product.id.toString();
			delete product.id;
		}

		const medusa_id = product.medusa_id;
		const found = await getStrapiDataByMedusaId(uid, strapi, medusa_id, ['id', 'medusa_id']);

		if (found) {
			return found.id;
		}
		try {
			const productEntity = await createNestedEntity(uid, strapi, product);
			return productEntity;
		} catch (e) {
			strapi.log.error(`unable to sync product ${uid} ${product}`);
		}
	},
	async bootstrap(data) {
		strapi.log.debug('Syncing Products...');
		try {
			if (data && data.length) {
				for (let i = 0; i < data.length; i++) {
					const product = data[i];
					strapi.log.debug(`Syncing Products ${i} of ${data.length}...${product.title} `);
					const productStrapiId = await strapi.services[uid].syncProduct(product);
					if (productStrapiId) {
						strapi.log.debug(
							`Syncing Products after delegation ${i} of ${data.length}...${product.title} `
						);
					}
				}
			}
			strapi.log.info('Products Synced');
			return true;
		} catch (e) {
			handleError(strapi, e);
			return false;
		}
	},
	/* async createWithRelations(product) {
    try {
      product.medusa_id = product.id.toString();
      delete product.id;

      return await createOrUpdateProductAfterDelegation(product, strapi);
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },

  async updateWithRelations(product) {
    try {
      product.medusa_id = product.id.toString();
      delete product.id;

      return await createOrUpdateProductAfterDelegation(
        product,
        strapi,
        "update",
        true
      );
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },
  ?*async findOne(params = {}) {
    const fields = getFields(__filename, __dirname);
    let filters = {};
    if (params.medusa_id) {
      filters = {
        ...params,
      };
    } else if (params.product_id) {
      filters = {
        medusa_id: params.product_id,
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
