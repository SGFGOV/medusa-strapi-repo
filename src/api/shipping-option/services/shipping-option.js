"use strict";
const handleError = require("../../../utils/utils").handleError;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const uid = "api::shipping-option.shipping-option";
async function createShippingOptionAfterDelegation(shippingOption, strapi) {
  const {
    region,
    profile: shipping_profile,
    requirements: shipping_option_requirements,
    provider: fulfillment_provider,
    ...createPayload
  } = shippingOption;

  if (region) {
    createPayload.region = await strapi
      .service("api::region.region")
      .handleManyToOneRelation(region, "shipping-option");
  }

  if (shipping_profile) {
    createPayload.shipping_profile = await strapi
      .service("api::shipping-profile.shipping-profile")
      .handleManyToOneRelation(shipping_profile, "shipping-option");
  }

  if (shipping_option_requirements && shipping_option_requirements.length) {
    createPayload.shipping_option_requirements = await strapi
      .service("api::shipping-option-requirement.shipping-option-requirement")
      .handleOneToManyRelation(shipping_option_requirements, "shipping-option");
  }

  if (fulfillment_provider) {
    createPayload.fulfillment_provider = await strapi
      .service("api::fulfillment-provider.fulfillment-provider")
      .handleManyToOneRelation(fulfillment_provider, "shipping-option");
  }

  const create = await strapi.entityService.create(uid, {
    data: createPayload,
  });
  return create.id;
}

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(uid, ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug("Syncing Shipping Options....");

    try {
      if (data && data.length) {
        for (const shipping_option of data) {
          if (!shipping_option.medusa_id) {
            shipping_option.medusa_id = shipping_option.id.toString();
            delete shipping_option.id;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: shipping_option.medusa_id,
          });
          if (found) {
            continue;
          }

          await createShippingOptionAfterDelegation(shipping_option, strapi);
        }
      }
      strapi.log.info("Shipping Options Synced");
      return true;
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },

  async handleOneToManyRelation(shippingOptions, caller) {
    const shippingOptionsStrapiIds = [];

    try {
      if (shippingOptions && shippingOptions.length) {
        for (const shippingOption of shippingOptions) {
          if (shippingOption.id) {
            shippingOption.medusa_id = shippingOption.id;
            delete shippingOption.id;
          }

          // This prevents an infinite loop. Since a cycle exists:  shipping_option -> shipping_profile -> shipping_option
          if (caller === "shipping-profile") {
            delete shippingOption.shipping_profile;
            delete shippingOption.profile;
          }

          const found = await strapi.services[uid].findOne({
            medusa_id: shippingOption.medusa_id,
          });
          if (found) {
            shippingOptionsStrapiIds.push({ id: found.id });
            continue;
          }

          const create = await createShippingOptionAfterDelegation(
            shippingOption,
            strapi
          );
          shippingOptionsStrapiIds.push({ id: create });
        }
      }
      return shippingOptionsStrapiIds;
    } catch (e) {
      handleError(strapi, e);
      throw new Error("Delegated creation failed");
    }
  },
  async findOne(params = {}) {
    const fields = ["id"];
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
  },
  async delete(medusa_id, params = {}) {
    const exists = await this.findOne(medusa_id);
    if (exists) {
      return strapi.entityService.delete(uid, exists.id, params);
    }
  },
}));
