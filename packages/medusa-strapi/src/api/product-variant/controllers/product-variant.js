'use strict';
/**
 *  product-variant controller
 */

function performCleanups(productVariantBody) {
	Object.keys(productVariantBody).forEach(
		(key) => productVariantBody[key] === undefined && delete productVariantBody[key]
	);
	//  delete productVariantBody.product;
	// delete productVariantBody.product_id;
	// Since strapi doesn't allow us to create a model with name "length". We have created it with name "product_variant_length".
	productVariantBody.product_variant_length = productVariantBody.length;
	delete productVariantBody.length;
}

const { createCoreController } = require('@strapi/strapi').factories;

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::product-variant.product-variant';
module.exports = createMedusaDefaultController(uid);

/*
module.exports = createCoreController("api::product-variant.product-variant", {
 /* async findOne(ctx) {
    try {
      const { id: medusaId } = ctx.params;
      const productVariant = await strapi.services[
        "api::product-variant.product-variant"
      ].findOne({
        product_variant_id: medusaId,
      });
      if (productVariant && productVariant.id) {
        return (ctx.body = { productVariant });
      }
      return ctx.notFound(ctx);
    } catch (e) {
      handleError(strapi, e);
      return ctx.internalServerError(ctx, e);
    }
  },
  /* async create(ctx) {
    try {
      const productVariantBody = ctx.request.body.data || ctx.request.body;

      const product = productVariantBody.product;
      // The product for this productVariant must exist. Otherwise we error out.
      // also during testing we've not implemented complex models. 
      if (process.env.NODE_ENV != "test" && product) {
        return ctx.badRequest(ctx, "Orphaned product variant");
      }

      performCleanups(productVariantBody);

      const create = await strapi
        .service("api::product-variant.product-variant")
        .createWithRelations(productVariantBody);
      if (create) {
        return (ctx.body = { id: create });
      }
      return ctx.badRequest(ctx);
    } catch (e) {
      handleError(strapi, e);
      return ctx.internalServerError(ctx, e);
    }
  },*/
/* async update(ctx) {
    try {
      const { id: medusaId } = ctx.params;
      const productVariantBody = ctx.request.body.data || ctx.request.body;

      const product = productVariantBody.product;
      // The product for this productVariant must exist. Otherwise we error out.
      // not checking orphaning during tests
      if (process.env.NODE_ENV != "test" && !product) {
        return ctx.badRequest(ctx, "Orphaned product variant");
      }

      performCleanups(productVariantBody);

      const found = await strapi.services[
        "api::product-variant.product-variant"
      ].findOne({
        medusa_id: medusaId,
      });

      if (found) {
        const update = await strapi
          .service("api::product-variant.product-variant")
          .updateWithRelations(productVariantBody);
        if (update) {
          return (ctx.body = { id: update });
        } else {
          return ctx.internalServerError(ctx, "ERROR");
        }
      }

      const create = await strapi
        .service("api::product-variant.product-variant")
        .createWithRelations(productVariantBody);
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
      const productVariant = await strapi
        .service("api::product-variant.product-variant")
        .findOne({ medusa_id: medusaId });
      if (productVariant) {
        await strapi
          .service("api::product-variant.product-variant")
          .delete(productVariant.id);
        return (ctx.body = {
          id: productVariant.id,
        });
      }
      return ctx.notFound(ctx);
    } catch (e) {
      handleError(strapi, e);
      return ctx.internalServerError(ctx, e);
    }
  },
});*/
