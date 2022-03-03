'use strict';

/**
 *  image controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::region.region', {
  async findOne(ctx) {
    try {
      const { medusaId } = ctx.params
      const region = await strapi
        .query("region", "")
        .findOne({ region_id: medusaId })
      if (region && region.id) {
        return strapi.config.functions.response.success(ctx, { region })
      }
      return strapi.config.functions.response.notFound(ctx)
    } catch (e) {
      return strapi.config.functions.response.serverError(ctx)
    }
  },
  async create(ctx) {
    try {
      const regionBody = ctx.request.body
      Object.keys(regionBody).forEach(
        (key) => regionBody[key] === undefined && delete regionBody[key]
      )

      const create = await strapi.services.region.createWithRelations(
        regionBody
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
      const regionBody = ctx.request.body
      Object.keys(regionBody).forEach(
        (key) => regionBody[key] === undefined && delete regionBody[key]
      )

      const found = await strapi.query("region", "").findOne({
        medusa_id: medusaId,
      })

      if (found) {
        const update = await strapi.services.region.updateWithRelations(
          regionBody
        )
        if (update) {
          return strapi.config.functions.response.success(ctx, { id: update })
        }
      }

      const create = await strapi.services.region.createWithRelations(
        regionBody
      )
      if (create) {
        return strapi.config.functions.response.success(ctx, { id: create })
      }

      return strapi.config.functions.response.notFound(ctx)
    } catch (e) {
      return strapi.config.functions.response.serverError(ctx, e)
    }
  },
})
