"use strict";
const handleError = require("../../../utils/utils").handleError;
/*
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const uid = "api::product.product";
async function createOrUpdateProductAfterDelegation(
  product,
  strapi = strapi,
  action = "create",
  forceUpdateRelation = false
) {
  const {
    options: product_options,
    variants: product_variants,
    tags: product_tags,
    profile: shipping_profile,
    type: product_type,
    collection: product_collection,
    store: store,
    images,
    ...payload
  } = product;
  if (product_options) {
    try {
      payload.product_options = await strapi
        .service("api::product-option.product-option")
        .handleOneToManyRelation(product_options, forceUpdateRelation);
    } catch (e) {
      strapi.log.error("unable to create/update product options");
      handleError(strapi, e);
    }
  }

  if (product_variants) {
    try {
      payload.product_variants = await strapi
        .service("api::product-variant.product-variant")
        .handleOneToManyRelation(
          product_variants,
          "product",
          forceUpdateRelation
        );
    } catch (e) {
      strapi.log.error("unable to create/update product variants");
      handleError(strapi, e);
    }
  }

  //
  if (product_tags) {
    payload.product_tags = await strapi
      .service("api::product-tag.product-tag")
      .handleManyToManyRelation(product_tags);
  }

  //
  if (shipping_profile) {
    payload.shipping_profile = await strapi
      .service("api::shipping-profile.shipping-profile")
      .handleManyToOneRelation(shipping_profile);
  }

  //
  if (product_type) {
    payload.product_type = await strapi
      .service("api::product-type.product-type")
      .handleManyToOneRelation(product_type);
  }

  //
  if (product_collection) {
    payload.product_collection = await strapi
      .service("api::product-collection.product-collection")
      .handleManyToOneRelation(product_collection);
  }

  if (store) {
    payload.store = await strapi
      .service("api::store.store")
      .handleManyToOneRelation(store);
  }

  //
  if (images) {
    payload.images = await strapi
      .service("api::image.image")
      .handleManyToManyRelation(images);
  }

  if (action === "update") {
    const found = await strapi.services[uid].findOne({
      medusa_id: product.medusa_id,
    });
    if (found) {
      const update = await strapi.services[uid].update(found.id, {
        data: payload,
      });
      return update.id;
    } else {
      strapi.log.error(
        `product with medusa_id${product.medusa_id} wasn't found`
      );
      return;
    }
  }

  const create = await strapi.entityService.create(uid, {
    data: payload,
  });
  return create.id;
}

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(uid, ({ strapi }) => ({
  async syncProduct(product) {
    if (!product.medusa_id) {
      product.medusa_id = product.id.toString();
      delete product.id;
    }
    const found = await strapi.services[uid].findOne({
      medusa_id: product.medusa_id,
    });
    if (found) {
      return found.id;
    }

    const productStrapiId = await createOrUpdateProductAfterDelegation(
      product,
      strapi
    );
    return productStrapiId;
  },
  async bootstrap(data) {
    strapi.log.debug("Syncing Products...");
    try {
      if (data && data.length) {
        for (let i = 0; i < data.length; i++) {
          const product = data[i];
          strapi.log.debug(
            `Syncing Products ${i} of ${data.length}...${product.title} `
          );
          const productStrapiId = await strapi.services[uid].syncProduct(
            product
          );
          if (productStrapiId) {
            strapi.log.debug(
              `Syncing Products after delegation ${i} of ${data.length}...${product.title} `
            );
          }
        }
      }
      strapi.log.info("Products Synced");
      return true;
    } catch (e) {
      handleError(strapi, e);
      return false;
    }
  },
  async createWithRelations(product) {
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
  async findOne(params = {}) {
    const fields = ["id"];
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
  },
  async delete(strapi_id, params = {}) {
    return await strapi.entityService.delete(uid, strapi_id, params);
  },
}));
