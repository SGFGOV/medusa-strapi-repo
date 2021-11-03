'use strict';

const {badRequest, notFound, serverError, success} = require("../../../utils/response");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

function performCleanups(productVariantBody) {
  Object.keys(productVariantBody).forEach(key => productVariantBody[key] === undefined && delete productVariantBody[key]);
  delete productVariantBody.product;
  delete productVariantBody.product_id;
  // Since strapi doesn't allow us to create a model with name "length". We have created it with name "product_variant_length".
  productVariantBody.product_variant_length = productVariantBody.length;
  delete productVariantBody.length;
}

module.exports = {
  async findOne(ctx) {
    try {
      const { medusaId } = ctx.params;
      const productVariant = await strapi.query('product-variant', '').findOne({ product_variant_id: medusaId });
      if (productVariant && productVariant.id) {
        return success(ctx, { productVariant })
      }
      return notFound(ctx);
    } catch (e) {
      return serverError(ctx, e);
    }
  },
  async create(ctx) {
    try {
      const productVariantBody = ctx.request.body;

      let product = productVariantBody.product;
      // The product for this productVariant must exist. Otherwise we error out.
      if (!product) {
        return badRequest(ctx, "Orphaned product variant");
      }

      performCleanups(productVariantBody);

      const create = await strapi.services['product-variant'].createWithRelations(productVariantBody);
      if (create) {
        return success(ctx, { id: create });
      }
      return badRequest(ctx);
    } catch (e) {
      return serverError(ctx, e);
    }

  },
  async update(ctx) {
    try {
      const { medusaId } = ctx.params;
      const productVariantBody = ctx.request.body;

      let product = productVariantBody.product;
      // The product for this productVariant must exist. Otherwise we error out.
      if (!product) {
        return badRequest(ctx, "Orphaned product variant");
      }

      performCleanups(productVariantBody);

      const found = await strapi.query('product-variant', '').findOne({
        medusa_id: medusaId
      });

      if (found) {
        const update = await strapi.services['product-variant'].updateWithRelations(productVariantBody);
        if (update) {
          return success(ctx, { id: update });
        } else {
          return serverError(ctx, 'ERROR');
        }
      }

      const create = await strapi.services['product-variant'].createWithRelations(productVariantBody);
      if (create) {
        return success(ctx, { id: create });
      }

      return notFound(ctx);
    } catch (e) {
      return serverError(ctx, e);
    }
  },
  async delete(ctx) {
    try {
      const { medusaId } = ctx.params;
      const productVariant = await strapi.query('product-variant', '').findOne({ medusa_id: medusaId });
      if (productVariant) {
        await strapi.query('product-variant', '').delete({
          medusa_id: medusaId
        });
        return success(ctx, {
          id: productVariant.id
        });
      }
      return notFound(ctx)
    } catch (e) {
      console.log('Error occurred while trying to delete product variant');
      return serverError(ctx, e);
    }
  },
};
