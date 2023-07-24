import {
	Product,
	ProductService,
	ProductVariant,
	ProductVariantService,
	Region,
	RegionService,
	TransactionBaseService,
} from '@medusajs/medusa';
import { Logger } from '@medusajs/medusa/dist/types/global';
import { BaseService } from 'medusa-interfaces';
import { addIgnore_, shouldIgnore_ } from '../utils/redis-key-manager';
import { EntityManager } from 'typeorm';

function isEmptyObject(obj): boolean {
	// eslint-disable-next-line guard-for-in
	for (const i in obj) {
		return false;
	}
	return true;
}

class UpdateMedusaService extends TransactionBaseService {
	productService_: ProductService;
	productVariantService_: ProductVariantService;
	redisClient_: any;
	regionService_: RegionService;
	logger: Logger;
	manager: EntityManager;
	constructor(container: { manager; productService; productVariantService; regionService; redisClient; logger }) {
		super(container);
		this.manager = container.manager;
		this.productService_ = container.productService;
		this.productVariantService_ = container.productVariantService;
		this.redisClient_ = container.redisClient;
		this.regionService_ = container.regionService;
		this.logger = container.logger;
	}

	async sendStrapiProductVariantToMedusa(variantEntry, variantId): Promise<ProductVariant> {
		const ignore = await shouldIgnore_(variantId, 'medusa', this.redisClient_);
		if (ignore) {
			return;
		}

		const result = await this.atomicPhase_(async (manager) => {
			const variant = await this.productVariantService_.withTransaction(manager).retrieve(variantId);
			const update = {};
			try {
				if (variant.title !== variantEntry.title) {
					update['title'] = variantEntry.title;
				}

				if (!isEmptyObject(update)) {
					const updatedVariant = await this.productVariantService_
						.withTransaction(manager)
						.update(variantId, update)
						.then(async () => {
							return await addIgnore_(variantId, 'strapi', this.redisClient_);
						});

					return updatedVariant;
				}
			} catch (error) {
				this.logger.error(error);
				return;
			}
		});
		return result;
	}

	async sendStrapiProductToMedusa(productEntry, productId): Promise<Product> {
		const ignore = await shouldIgnore_(productId, 'medusa', this.redisClient_);
		if (ignore) {
			return;
		}

		// get entry from Strapi
		// const productEntry = null

		const result = await this.atomicPhase_(async (manager) => {
			try {
				const product = await this.productService_.withTransaction(manager).retrieve(productId);

				const update = {};

				// update Medusa product with Strapi product fields
				const title = productEntry.title;
				const subtitle = productEntry.subtitle;
				const description = productEntry.description;
				const handle = productEntry.handle;
				const thumbnail = productEntry.thumbnail

				if (product.title !== title) {
					update['title'] = title;
				}

				if (product.subtitle !== subtitle) {
					update['subtitle'] = subtitle;
				}

				if (product.description !== description) {
					update['description'] = description;
				}

				if (product.handle !== handle) {
					update['handle'] = handle;
				}

				// Get the thumbnail, if present
				if (product.thumbnail!== thumbnail ) {
					update['thumbnail'] = thumbnail;
				}


				if (!isEmptyObject(update)) {
					await this.productService_
						.withTransaction(manager)
						.update(productId, update)
						.then(async () => {
							return await addIgnore_(productId, 'strapi', this.redisClient_);
						});
				}
				return product;
			} catch (error) {
				this.logger.error(error);
				return;
			}
		});
	}

	async sendStrapiRegionToMedusa(regionEntry, regionId): Promise<Region> {
		const ignore = await shouldIgnore_(regionId, 'medusa', this.redisClient_);
		if (ignore) {
			return;
		}
		const result = await this.atomicPhase_(async (manager) => {
			try {
				const region = await this.regionService_.withTransaction(manager).retrieve(regionId);
				const update = {};

				if (region.name !== regionEntry.name) {
					update['name'] = regionEntry.name;
				}

				if (!isEmptyObject(update)) {
					const updatedRegion = await this.regionService_
						.withTransaction(manager)
						.update(regionId, update)
						.then(async () => {
							return await addIgnore_(regionId, 'strapi', this.redisClient_);
						});
					return updatedRegion;
				}
				return result;
			} catch (error) {
				this.logger.error(error);
				return;
			}
		});
	}
}

export default UpdateMedusaService;
