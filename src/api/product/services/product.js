'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
async function createOrUpdateProductAfterDelegation(product, action = "create", forceUpdateRelation = false) {
  const { 'options': product_options, 'variants': product_variants, 'tags': product_tags, 'profile': shipping_profile, 'type': product_type, 'collection': product_collection, images, ...payload } = product;
  if (product_options) {
    payload.product_options = await strapi.service('api::product-option.product-option').handleOneToManyRelation(product_options, forceUpdateRelation);
  }

  if (product_variants) {
    payload.product_variants = await strapi.service('api::product-variant.product-variant').handleOneToManyRelation(product_variants, 'product', forceUpdateRelation);
  }

  //
  if (product_tags) {
    payload.product_tags = await strapi.service('api::product-tag.product-tag').handleManyToManyRelation(product_tags);
  }

  //
  if (shipping_profile) {
    payload.shipping_profile = await strapi.service('api::shipping-profile.shipping-profile').handleManyToOneRelation(shipping_profile);
  }

  //
  if (product_type) {
    payload.product_type = await strapi.service('api::product-type.product-type').handleManyToOneRelation(product_type);
  }

  //
  if (product_collection) {
    payload.product_collection = await strapi.service('api::product-collection.product-collection').handleManyToOneRelation(product_collection);
  }

  //
  if (images) {
    payload.images = await strapi.service('api::image.image').handleManyToManyRelation(images);
  }

  if (action === 'update') {
    const update = await strapi.db.query('api::product.product').update({ 
      where: { medusa_id: product.medusa_id },
      data: payload
     });
    return update.id;
  }

  const create = await strapi.entityService.create('api::product.product', { data: payload });
  return create.id;
}

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product.product', ({ strapi }) => ({
  async bootstrap(data) {
    strapi.log.debug('Syncing Products...');
    try {
      if (data && data.length) {
        for (let product of data) {
          if (!product.medusa_id) {
            product.medusa_id = product.id.toString();
            delete product.id
          }

          const found = await strapi.db.query('api::product.product').findOne({ 
            where: { medusa_id: product.medusa_id }
           });
          if (found) {
            continue;
          }

          const productStrapiId = await createOrUpdateProductAfterDelegation(product);
        }
      }
      strapi.log.info('Products Synced');
      return true;
    } catch (e) {
      console.log(e);
      return false
    }
  },
  async createWithRelations(product) {
    try {
      product.medusa_id = product.id.toString();
      delete product.id;

      return await createOrUpdateProductAfterDelegation(product);
    } catch (e) {
      console.log('Some error occurred while creating product \n', e);
      return false;
    }
  },

  async updateWithRelations(product) {
    try {
      product.medusa_id = product.id.toString();
      delete product.id;

      return await createOrUpdateProductAfterDelegation(product, 'update', true);
    } catch (e) {
      console.log('Some error occurred while updating product \n', e);
      return false;
    }
  }
}));
