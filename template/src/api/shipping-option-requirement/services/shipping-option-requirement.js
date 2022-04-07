'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::shipping-option-requirement.shipping-option-requirement', ({ strapi }) => ({
  async handleOneToManyRelation(shippingOptionRequirements) {
    const shippingOptionRequirementStrapiIds = [];
    try {
      if (shippingOptionRequirements && shippingOptionRequirements.length) {
        for (let shippingOptionRequirement of shippingOptionRequirements) {
          if (shippingOptionRequirement.id) {
            shippingOptionRequirement.medusa_id = shippingOptionRequirement.id;
            delete shippingOptionRequirement.id;
          }

          const found = await strapi.query('shipping-option-requirement', '').findOne({
            medusa_id: shippingOptionRequirement.medusa_id
          });
          if (found) {
            shippingOptionRequirementStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await strapi.services['shipping-option-requirement'].create(shippingOptionRequirement);
          shippingOptionRequirementStrapiIds.push({ id: create.id });
        }
      }
      return shippingOptionRequirementStrapiIds;
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
  }
}));
