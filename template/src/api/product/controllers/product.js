'use strict';

/**
 *  product controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::product.product', {
  async findOne(ctx) {
    try {
      const { productId } = ctx.params
      const product = await strapi
        .query("product", "")
        .findOne({ product_id: productId })
      if (product && product.id) {
        return strapi.config.functions.response.success(ctx, { product })
      }
      return strapi.config.functions.response.notFound(ctx)
    } catch (e) {
      return strapi.config.functions.response.serverError(ctx, e)
    }
  },
  async create(ctx) {
    try {
      const productBody = ctx.request.body

      const create = await strapi.services.product.createWithRelations(
        productBody
      )
      if (create) {
        return strapi.config.functions.response.success(ctx, { id: create })
      }
      return strapi.config.functions.response.badRequest(ctx)
    } catch (e) {
      return strapi.config.functions.response.serverError(ctx, e)
    }
  },
  async update(ctx) {
    try {
      const { medusaId } = ctx.params
      const productBody = ctx.request.body

      productBody.product_length = productBody.length
      delete productBody.length

      const found = await strapi.query("product", "").findOne({
        medusa_id: medusaId,
      })

      if (found) {
        const update = await strapi.services["product"].updateWithRelations(
          productBody
        )
        if (update) {
          return strapi.config.functions.response.success(ctx, { id: update })
        } else {
          return strapi.config.functions.response.serverError(ctx, "ERROR")
        }
      }

      const create = await strapi.services["product"].createWithRelations(
        productBody
      )
      if (create) {
        return strapi.config.functions.response.success(ctx, { id: create })
      }

      return strapi.config.functions.response.notFound(ctx)
    } catch (e) {
      return strapi.config.functions.response.serverError(ctx, e)
    }
  },
  async delete(ctx) {
    try {
      const { medusaId } = ctx.params
      const product = await strapi
        .query("product", "")
        .findOne({ medusa_id: medusaId })
      if (product) {
        if (product.product_variants && product.product_variants.length) {
          await strapi
            .query("product-variant", "")
            .delete({ product: product.id })
        }
        await strapi.query("product", "").delete({
          medusa_id: medusaId,
        })
        return strapi.config.functions.response.success(ctx, {
          id: product.id,
        })
      }
      return strapi.config.functions.response.notFound(ctx)
    } catch (e) {
      console.log("Error occurred while trying to delete product variant")
      return strapi.config.functions.response.serverError(ctx, e)
    }
  },
});
