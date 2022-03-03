'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::money-amount.money-amount', ({ strapi }) => ({
  async handleOneToManyRelation(money_amounts, forceUpdate) {
    const moneyAmountsStrapiIds = [];
    if (money_amounts && money_amounts.length) {
      for (let money_amount of money_amounts) {
        try {
          if (!money_amount.medusa_id) {
            money_amount.medusa_id = money_amount.id;
            delete money_amount.id;
          }

          const found = await strapi.services['money-amount'].findOne({
            medusa_id: money_amount.medusa_id
          })
          if (found) {

            if (forceUpdate) {
              const update = await strapi.query('money-amount', '').update({
                medusa_id: money_amount.medusa_id
              }, {
                amount: money_amount.amount,
                sale_amount: money_amount.sale_amount
              });
              if (update) {
                moneyAmountsStrapiIds.push({ id: update.id });
                continue;
              }
            }

            moneyAmountsStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.services['money-amount'].create(money_amount);
          moneyAmountsStrapiIds.push({ id: create.id });
        } catch (e) {
          console.log(e);
          throw new Error('Delegated creation failed');
        }
      }
    }

    return moneyAmountsStrapiIds;
  }
}));
