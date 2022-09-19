'use strict';

/**
 *  product-variant controller
 */

function performCleanups(productVariantBody) {
  Object.keys(productVariantBody).forEach(
    (key) =>
      productVariantBody[key] === undefined && delete productVariantBody[key]
  )
  delete productVariantBody.product
  delete productVariantBody.product_id
  // Since strapi doesn't allow us to create a model with name "length". We have created it with name "product_variant_length".
  productVariantBody.product_variant_length = productVariantBody.length
  delete productVariantBody.length
}

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::product-variant.product-variant', {
  async findOne(ctx) {
    try {
      const { medusaId } = ctx.params
      const productVariant = await strapi
        .query("product-variant", "")
        .findOne({ product_variant_id: medusaId })
      if (productVariant && productVariant.id) {
        return strapi.config.functions.response.success(ctx, { productVariant })
      }
      return strapi.config.functions.response.notFound(ctx)
    } catch (e) {
      return strapi.config.functions.response.serverError(ctx, e)
    }
  },
  async create(ctx) {
    try {
      const productVariantBody = ctx.request.body

      const product = productVariantBody.product
      // The product for this productVariant must exist. Otherwise we error out.
      if (!product) {
        return strapi.config.functions.response.badRequest(
          ctx,
          "Orphaned product variant"
        )
      }

      performCleanups(productVariantBody)

      const create = await strapi.services[
        "product-variant"
      ].createWithRelations(productVariantBody)
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
      const productVariantBody = ctx.request.body

      const product = productVariantBody.product
      // The product for this productVariant must exist. Otherwise we error out.
      if (!product) {
        return strapi.config.functions.response.badRequest(
          ctx,
          "Orphaned product variant"
        )
      }

      performCleanups(productVariantBody)

      const found = await strapi.query("product-variant", "").findOne({
        medusa_id: medusaId,
      })

      if (found) {
        const update = await strapi.services[
          "product-variant"
        ].updateWithRelations(productVariantBody)
        if (update) {
          return strapi.config.functions.response.success(ctx, { id: update })
        } else {
          return strapi.config.functions.response.serverError(ctx, "ERROR")
        }
      }

      const create = await strapi.services[
        "product-variant"
      ].createWithRelations(productVariantBody)
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
      const productVariant = await strapi
        .query("product-variant", "")
        .findOne({ medusa_id: medusaId })
      if (productVariant) {
        await strapi.query("product-variant", "").delete({
          medusa_id: medusaId,
        })
        return strapi.config.functions.response.success(ctx, {
          id: productVariant.id,
        })
      }
      return strapi.config.functions.response.notFound(ctx)
    } catch (e) {
      console.log("Error occurred while trying to delete product variant")
      return strapi.config.functions.response.serverError(ctx, e)
    }
  },
})
