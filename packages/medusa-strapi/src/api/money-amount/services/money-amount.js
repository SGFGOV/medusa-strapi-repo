'use strict';
const handleError = require('../../../utils/utils').handleError;
const getFields = require('../../../utils/utils').getFields;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const uid = 'api::money-amount.money-amount';
module.exports = createCoreService(uid, ({ strapi }) => ({
	/*
  async handleOneToManyRelation(money_amounts, forceUpdate) {
    const moneyAmountsStrapiIds = [];
    if (money_amounts && money_amounts.length) {
      for (const money_amount of money_amounts) {
        try {
          if (!money_amount.medusa_id) {
            money_amount.medusa_id = money_amount.id;
            delete money_amount.id;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: money_amount.medusa_id,
          });
          if (found) {
            if (forceUpdate) {
              const update = await strapi.services[uid].update(found.id, {
                data: {
                  medusa_id: money_amount.medusa_id,
                  amount: money_amount.amount,
                  sale_amount: money_amount.sale_amount,
                },
              });
              if (update) {
                moneyAmountsStrapiIds.push({ id: update.id });
                continue;
              }
            }

            moneyAmountsStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.entityService.create(uid, {
            data: money_amount,
          });
          moneyAmountsStrapiIds.push({ id: create.id });
        } catch (e) {
          handleError(strapi, e);
          throw new Error("Delegated creation failed");
        }
      }
    }

    return moneyAmountsStrapiIds;
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
}));
