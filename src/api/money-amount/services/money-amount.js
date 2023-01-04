"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
  "api::money-amount.money-amount",
  ({ strapi }) => ({
    async handleOneToManyRelation(money_amounts, forceUpdate) {
      const moneyAmountsStrapiIds = [];
      if (money_amounts && money_amounts.length) {
        for (const money_amount of money_amounts) {
          try {
            if (!money_amount.medusa_id) {
              money_amount.medusa_id = money_amount.id;
              delete money_amount.id;
            }

            const found = await strapi.services[
              "api::money-amount.money-amount"
            ].findOne({
              medusa_id: money_amount.medusa_id,
            });
            if (found) {
              if (forceUpdate) {
                const update = await strapi.services[
                  "api::money-amount.money-amount"
                ].update(found.id, {
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

            const create = await strapi.entityService.create(
              "api::money-amount.money-amount",
              {
                data: money_amount,
              }
            );
            moneyAmountsStrapiIds.push({ id: create.id });
          } catch (e) {
            strapi.log.error(JSON.stringify(e));
            throw new Error("Delegated creation failed");
          }
        }
      }

      return moneyAmountsStrapiIds;
    },
    async findOne(params = {}) {
      const fields = ["id"];
      const filters = {
        ...params,
      };
      return (
        await strapi.entityService.findMany("api::money-amount.money-amount", {
          fields,
          filters,
        })
      )[0];
    },
  })
);
