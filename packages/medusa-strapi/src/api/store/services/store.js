'use strict';

const handleError = require('../../../utils/utils').handleError;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const uid = 'api::store.store';
const { createNestedEntity } = require('../../../utils/utils');
const getStrapiDataByMedusaId = require('../../../utils/utils').getStrapiDataByMedusaId;
module.exports = createCoreService(uid, ({ strapi }) => ({
	async bootstrap(data) {
		strapi.log.debug('Syncing Store....');
		try {
			if (data && data.length) {
				for (const store of data) {
					if (!store) {
						strapi.log.error(`unable to sync store ${uid} ${store} store undefined`);
						return false;
					}
					if (!store.medusa_id) {
						store.medusa_id = store.id.toString();
					}

					const found = await getStrapiDataByMedusaId(uid, strapi, store.medusa_id, ['id', 'medusa_id']);

					if (found) {
						continue;
					}
					try {
						const regionStrapi = await createNestedEntity(uid, strapi, store);
						if (regionStrapi.id) {
							strapi.log.info(`Store created : ${regionStrapi.id} ${regionStrapi.name}`);
						}
					} catch (e) {
						strapi.log.error(`unable to sync store ${uid} ${store}`);
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
	},
	/*
  
  async handleManyToOneRelation(store) {
    try {
      const found = await strapi.services[uid].findOne({
        medusa_id: store.id,
      });
      if (found) {
        return found.id;
      }

      const create = await strapi.entityService.create(uid, { data: store });
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
  },*/
	async delete(strapi_id, params = {}) {
		return await strapi.entityService.delete(uid, strapi_id, params);
	},
	/* async create(params = {}) {
    const { data } = params;

    /* if (hasDraftAndPublish(contentType)) {
      setPublishedAt(data);
    }

    return await strapi.entityService.create(uid, {
      ...params,
      data: { ...data, populate: data },
    });
  },*/
}));
