"use strict";
const handleError = require("../../../utils/utils").handleError;
/**
 *  image controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::region.region", {
  async findOne(ctx) {
    try {
      const { id: medusaId } = ctx.params;
      const region = await strapi
        .service("api::region.region")
        .findOne({ region_id: medusaId });
      if (region && region.id) {
        return (ctx.body = { region });
      }
      return ctx.notFound(ctx);
    } catch (e) {
      handleError(strapi, e);
      return ctx.internalServerError(ctx);
    }
  },
  async create(ctx) {
    try {
      const regionBody = ctx.request.body.data ?? ctx.request.body;
      //const regionBody = ctx.request.body;
      Object.keys(regionBody).forEach(
        (key) => regionBody[key] === undefined && delete regionBody[key]
      );

      const create = await strapi
        .service("api::region.region")
        .createWithRelations(regionBody);
      if (create) {
        return (ctx.body = { id: create });
      }
      return ctx.badRequest(ctx);
    } catch (e) {
      handleError(strapi, e);
      return ctx.internalServerError(ctx, e);
    }
  },
  async update(ctx) {
    try {
      const { id: medusaId } = ctx.params;
      const regionBody = ctx.request.body.data ?? ctx.request.body;
      Object.keys(regionBody).forEach(
        (key) => regionBody[key] === undefined && delete regionBody[key]
      );

      const found = await strapi.services["api::region.region"].findOne({
        medusa_id: medusaId,
      });

      if (found) {
        const update = await strapi.services[
          "api::region.region"
        ].updateWithRelations(regionBody);
        if (update) {
          return (ctx.body = { id: update });
        }
      }

      const create = await strapi
        .service("api::region.region")
        .createWithRelations(regionBody);
      if (create) {
        return (ctx.body = { id: create });
      }

      return ctx.notFound(ctx);
    } catch (e) {
      handleError(strapi, e);
      return ctx.internalServerError(ctx, e);
    }
  },
  async delete(ctx) {
    try {
      const { id: medusaId } = ctx.params;
      const region = await strapi
        .service("api::region.region")
        .findOne({ medusa_id: medusaId });
      if (region) {
        await strapi.service("api::region.region").delete(region.id);
        return (ctx.body = {
          id: region.id,
        });
      }
      return ctx.notFound(ctx);
    } catch (e) {
      handleError(strapi, e);
      return ctx.internalServerError(ctx, e);
    }
  },
});
