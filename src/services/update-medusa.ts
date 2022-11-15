import { Product, ProductService, ProductVariant,
  ProductVariantService, Region, RegionService } from "@medusajs/medusa";
import { Logger } from "@medusajs/medusa/dist/types/global";
import { BaseService } from "medusa-interfaces";
import { addIgnore_, shouldIgnore_ } from "../utils/redis-key-manager";

function isEmptyObject(obj):boolean {
  // eslint-disable-next-line guard-for-in
  for (const i in obj) {
    return false;
  }
  return true;
}

class UpdateMedusaService extends BaseService {
  productService_: ProductService;
  productVariantService_: ProductVariantService;
  redisClient_: any;
  regionService_: RegionService;
  logger:Logger;
  constructor({
    productService,
    productVariantService,
    regionService,
    redisClient,
    logger,
  }) {
    super();

    this.productService_ = productService;
    this.productVariantService_ = productVariantService;
    this.redisClient_ = redisClient;
    this.regionService_ = regionService;
    this.logger = logger;
  }

  async sendStrapiProductVariantToMedusa(variantEntry,
      variantId):Promise<ProductVariant> {
    const ignore = await shouldIgnore_(variantId, "medusa", this.redisClient_);
    if (ignore) {
      return;
    }

    try {
      const variant = await this.productVariantService_.retrieve(variantId);
      const update = {};

      if (variant.title !== variantEntry.title) {
        update["title"] = variantEntry.title;
      }

      if (!isEmptyObject(update)) {
        const updatedVariant = await this.productVariantService_
            .update(variantId, update)
            .then(async () => {
              return await addIgnore_(variantId, "strapi", this.redisClient_);
            });

        return updatedVariant;
      }
    } catch (error) {
      this.logger.error(error);
      return;
    }
  }

  async sendStrapiProductToMedusa(productEntry, productId):Promise<Product> {
    const ignore = await shouldIgnore_(productId, "medusa", this.redisClient_);
    if (ignore) {
      return;
    }

    try {
      // get entry from Strapi
      // const productEntry = null

      const product = await this.productService_.retrieve(productId);

      const update = {};

      // update Medusa product with Strapi product fields
      const title = productEntry.title;
      const subtitle = productEntry.subtitle;
      const description = productEntry.description;
      const handle = productEntry.handle;

      if (product.title !== title) {
        update["title"] = title;
      }

      if (product.subtitle !== subtitle) {
        update["subtitle"] = subtitle;
      }

      if (product.description !== description) {
        update["description"] = description;
      }

      if (product.handle !== handle) {
        update["handle"] = handle;
      }

      // Get the thumbnail, if present
      if (productEntry.thumbnail) {
        const thumb = null;
        update["thumbnail"] = thumb;
      }

      if (!isEmptyObject(update)) {
        await this.productService_.update(productId, update).then(async () => {
          return await addIgnore_(productId, "strapi", this.redisClient_);
        });
      }
    } catch (error) {
      this.logger.error(error);
      return;
    }
  }

  async sendStrapiRegionToMedusa(regionEntry, regionId):Promise<Region> {
    const ignore = await shouldIgnore_(regionId, "medusa", this.redisClient_);
    if (ignore) {
      return;
    }

    try {
      const region = await this.regionService_.retrieve(regionId);
      const update = {};

      if (region.name !== regionEntry.name) {
        update["name"] = regionEntry.name;
      }

      if (!isEmptyObject(update)) {
        const updatedRegion = await this.regionService_
            .update(regionId, update)
            .then(async () => {
              return await addIgnore_(regionId, "strapi", this.redisClient_);
            });
        return updatedRegion;
      }
    } catch (error) {
      this.logger.error(error);
      return;
    }
  }
}

export default UpdateMedusaService;
