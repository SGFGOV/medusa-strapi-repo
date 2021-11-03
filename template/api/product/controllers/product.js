'use strict';

const {badRequest} = require("../../../utils/response");
const {serverError, notFound, success} = require("../../../utils/response");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findOne(ctx) {
    try {
      const { productId } = ctx.params;
      const product = await strapi.query('product', '').findOne({ product_id: productId });
      if (product && product.id) {
        return success(ctx, { product });
      }
      return notFound(ctx);

    } catch (e) {
      return serverError(ctx, e);
    }

  },
  async create(ctx) {
    try {
      const productBody = ctx.request.body;

      const create = await strapi.services['product'].createWithRelations(productBody);
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
      const productBody = ctx.request.body;

      productBody.product_length = productBody.length;
      delete productBody.length;

      const found = await strapi.query('product', '').findOne({
        medusa_id: medusaId
      });

      if (found) {
        const update = await strapi.services['product'].updateWithRelations(productBody);
        if (update) {
          return success(ctx, { id: update });
        } else {
          return serverError(ctx, 'ERROR');
        }
      }

      const create = await strapi.services['product'].createWithRelations(productBody);
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
      const product = await strapi.query('product', '').findOne({ medusa_id: medusaId });
      if (product) {
        if (product.product_variants && product.product_variants.length) {
          await strapi.query('product-variant', '').delete({ product: product.id });
        }
        await strapi.query('product', '').delete({
          medusa_id: medusaId
        });
        return success(ctx, {
          id: product.id
        });
      }
      return notFound(ctx)
    } catch (e) {
      console.log('Error occurred while trying to delete product variant');
      return serverError(ctx, e);
    }
  }
};
