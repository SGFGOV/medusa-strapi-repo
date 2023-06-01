'use strict';

import { AxiosResponse, Method, default as axios } from 'axios';
import { Logger } from '@medusajs/medusa/dist/types/global';
import { sleep } from '@medusajs/medusa/dist/utils/sleep';
import qs from 'qs';
import passwordGen from 'generate-password';
import axiosRetry from 'axios-retry';
import updateNotifier from 'update-notifier';
//import packageJson from '../../package.json'

//updateNotifier({ pkg: packageJson }).notify();
let strapiRetryDelay: number;

axiosRetry(axios as any, {
	retries: 100,
	retryDelay: (retryCount, error: any) => {
		error.response &&
			error.response.status === 429 &&
			// Use X-Retry-After rather than Retry-After, and cap retry delay at 60 seconds
			error.response.headers['x-retry-after'] &&
			parseInt(error.response.headers['x-retry-after']) <= 60;
		let retryHeaderDelay = parseInt(error.response.headers['x-retry-after'].toString());
		const rateLimitResetTime = parseInt(error.response.headers['x-ratelimit-reset'].toString());

		if (!retryHeaderDelay && !rateLimitResetTime) {
			/** @todo change from fixed back off to exponential backoff */
			// axiosRetry.exponentialDelay(retryCount)*1000
			return 400e3;
		}
		if (!retryHeaderDelay) {
			const currentTime = Date.now();
			const timeDiffms = Math.abs(parseInt(rateLimitResetTime.toString()) - Math.floor(currentTime / 1000)) + 2;
			retryHeaderDelay = timeDiffms * 1000;
			strapiRetryDelay = retryHeaderDelay;
		} else {
			strapiRetryDelay = retryCount * 1000 * retryHeaderDelay;
		}
		console.log(`retrying after ${strapiRetryDelay}`);
		return strapiRetryDelay;
	},
	shouldResetTimeout: false,
	onRetry: (retryCount, error: any) => {
		console.info(`retring request ${retryCount}` + ` because of ${error.response.status}  ${error.request.path}`);
	},
	retryCondition: async (error: any) => {
		return error.response.status === 429;
	},
});

// Custom retry delay

import {
	BaseEntity,
	EventBusService,
	Product,
	ProductCollectionService,
	ProductService,
	ProductTypeService,
	ProductVariantService,
	RegionService,
	TransactionBaseService,
	ProductCategoryService,
} from '@medusajs/medusa';
import role from '@strapi/plugin-users-permissions/server/content-types/role/index';
import {
	StrapiMedusaPluginOptions,
	Tokens,
	StrapiSendParams,
	MedusaUserType,
	AdminUserType,
	AuthInterface,
	CreateInStrapiParams,
	GetFromStrapiParams,
	userCreds as UserCreds,
	StrapiAdminSendParams,
} from '../types/globals';
import { EntityManager } from 'typeorm';
import _ from 'lodash';
import { TokenExpiredError } from 'jsonwebtoken';
import { Http2ServerResponse } from 'http2';
import { AxiosError } from 'axios';

export type StrapiEntity = BaseEntity & { medusa_id?: string };
export type AdminResult = { data: any; status: number };
export type AdminGetResult = {
	data: {
		data: {
			results: [];
		};
		meta: any;
	};
	status: number;
};
export type StrapiGetResult = {
	data: any[];
	meta?: any;

	status: number;
	medusa_id?: string;
	id?: number;
};

export type StrapiResult = {
	medusa_id?: string;
	id?: number;
	data?: any | any[];
	meta?: Record<string, any>;
	status: number;
};
const IGNORE_THRESHOLD = 3; // seconds

export interface StrapiQueryInterface {
	fields: string[];
	filters: Record<string, unknown>;
	populate?: any;
	sort?: string[];
	pagination?: {
		pageSize: number;
		page: number;
	};
	publicationState?: string;
	locale?: string[];
}

export interface UpdateStrapiServiceParams {
	manager: EntityManager;
	regionService: RegionService;
	productService: ProductService;
	redisClient: any;
	productVariantService: ProductVariantService;
	productTypeService: ProductTypeService;
	eventBusService: EventBusService;
	productCollectionService: ProductCollectionService;
	productCategoryService: ProductCategoryService;
	logger: Logger;
}

export interface LoginTokenExpiredErrorParams extends Partial<StrapiSendParams> {
	response?: { status: number };
	message?: string;
	error?: AxiosError;
	time?: Date;
}

export class LoginTokenExpiredError extends AxiosError {
	constructor(private readonly error: LoginTokenExpiredErrorParams) {
		super(error.message, '401', error.error.config, error.error.request, error.error.response);
	}
}

export class UpdateStrapiService extends TransactionBaseService {
	protected manager_: EntityManager;
	protected transactionManager_: EntityManager;
	static lastHealthCheckTime = 0;
	productService_: ProductService;
	productVariantService_: ProductVariantService;
	productTypeService_: ProductTypeService;
	regionService_: RegionService;
	eventBus_: EventBusService;
	algorithm: string;
	options_: StrapiMedusaPluginOptions;
	strapi_protocol: string;
	strapi_url: string;
	encryption_key: string;
	userTokens: Tokens;
	// strapiDefaultMedusaUserAuthToken: string;
	redis_: any;
	key: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>;
	defaultAuthInterface: AuthInterface;
	strapiSuperAdminAuthToken: string;
	defaultUserEmail: string;
	defaultUserPassword: string;
	userAdminProfile: { email: string };
	logger: Logger;
	static isHealthy: boolean;
	lastAdminLoginAttemptTime: number;
	isStarted: boolean;
	productCollectionService: ProductCollectionService;
	productCategoryService: any;
	private enableAdminDataLogging: boolean;
	selfTestMode: boolean;
	strapi_port: number;

	constructor(container: UpdateStrapiServiceParams, options: StrapiMedusaPluginOptions) {
		super(container);
		this.selfTestMode = false;
		this.enableAdminDataLogging = process.env.NODE_ENV == 'test' ? true : false;
		this.logger = container.logger ?? (console as any);
		this.productService_ = container.productService;
		this.productVariantService_ = container.productVariantService;
		this.productTypeService_ = container.productTypeService;
		this.regionService_ = container.regionService;
		this.eventBus_ = container.eventBusService;
		this.productCollectionService = container.productCollectionService;
		this.productCategoryService = container.productCategoryService;

		this.options_ = options;
		this.algorithm = this.options_.encryption_algorithm || 'aes-256-cbc'; // Using AES encryption
		this.strapi_protocol = this.options_.strapi_protocol ?? 'https';
		this.strapi_port = this.options_.strapi_port ?? (this.strapi_protocol == 'https' ? undefined : 1337);
		this.strapi_url =
			`${this.strapi_protocol}://` +
			`${this.options_.strapi_host ?? 'localhost'}` +
			`${this.strapi_port ? ':' + this.strapi_port : ''}`;
		this.encryption_key = this.options_.strapi_secret || this.options_.strapi_public_key;
		UpdateStrapiService.isHealthy = false;
		this.defaultUserEmail = options.strapi_default_user.email;
		this.defaultUserPassword = options.strapi_default_user.password;
		this.defaultAuthInterface = {
			email: this.defaultUserEmail,
			password: this.defaultUserPassword,
		};
		this.userTokens = {};
		this.executeStrapiHealthCheck().then(
			async (res) => {
				if (res && this.options_.auto_start) {
					UpdateStrapiService.isHealthy = res;
					let startupStatus;
					try {
						const startUpResult = await this.startInterface();
						startupStatus = startUpResult.status < 300;
					} catch (error) {
						this.logger.error(error.message);
					}

					if (!startupStatus) {
						throw new Error('strapi startup error');
					}
				}
			},
			() => {
				this.selfTestMode = true;
			}
		);

		// attaching the default user
		this.redis_ = container.redisClient;
	}

	withTransaction(transactionManager?: EntityManager): this {
		if (!transactionManager) {
			return this;
		}
		const cloned = new UpdateStrapiService(
			{
				manager: transactionManager,
				logger: this.logger,
				productService: this.productService_,
				productVariantService: this.productVariantService_,
				productTypeService: this.productTypeService_,
				regionService: this.regionService_,
				eventBusService: this.eventBus_,
				redisClient: this.redis_,
				productCollectionService: this.productCollectionService,
				productCategoryService: this.productCategoryService,
			},
			this.options_
		);

		this.transactionManager_ = transactionManager;
		return cloned as this;
	}

	async startInterface(): Promise<any> {
		try {
			const result = await this.intializeServer();
			this.logger.info('Successfully Bootstrapped the strapi server');
			return result;
		} catch (e) {
			this.logger.error(`Unable to  bootstrap the strapi server, 
        please check configuration , ${e}`);
			throw e;
		}
	}

	async addIgnore_(id, side): Promise<any> {
		const key = `${id}_ignore_${side}`;
		return await this.redis_.set(key, 1, 'EX', this.options_.strapi_ignore_threshold || IGNORE_THRESHOLD);
	}

	async shouldIgnore_(id, side): Promise<any> {
		const key = `${id}_ignore_${side}`;
		return await this.redis_.get(key);
	}

	async getVariantEntries_(variants, authInterface: AuthInterface): Promise<StrapiResult> {
		// eslint-disable-next-line no-useless-catch
		try {
			return { status: 400 };
		} catch (error) {
			throw error;
		}
	}

	async createImageAssets(product: Product, authInterface: AuthInterface): Promise<StrapiResult> {
		const assets = await Promise.all(
			product.images
				?.filter((image) => image.url !== product.thumbnail)
				.map(async (image) => {
					const result = await this.createEntryInStrapi({
						type: 'images',
						id: product.id,
						authInterface,
						data: image,
						method: 'post',
					});
					return result;
				})
		);
		return assets ? { status: 200, data: assets } : { status: 400 };
	}

	getCustomField(field, type): string {
		const customOptions = this.options_[`custom_${type}_fields`];

		if (customOptions) {
			return customOptions[field] || field;
		} else {
			return field;
		}
	}

	async createEntityInStrapi<T extends BaseEntity>(params: CreateInStrapiParams<T>): Promise<StrapiResult> {
		await this.checkType(params.strapiEntityType, params.authInterface);
		const entity = await params.medusaService.retrieve(params.id, {
			select: params.selectFields,
			relations: params.relations,
		});
		if (entity) {
			const result = await this.createEntryInStrapi({
				type: params.strapiEntityType,
				authInterface: params.authInterface,
				data: entity,
				method: 'POST',
			});
			return result;
		}
	}

	async getEntitiesFromStrapi(params: GetFromStrapiParams): Promise<StrapiGetResult> {
		await this.checkType(params.strapiEntityType, params.authInterface);
		try {
			const getEntityParams: StrapiSendParams = {
				type: params.strapiEntityType,
				authInterface: params.authInterface,
				method: 'GET',
				id: params.id,
			};

			const result = await this.getEntriesInStrapi(getEntityParams);
			return {
				data: result?.data,
				status: result.status,
				meta: result?.meta,
			};
		} catch (e) {
			this.logger.error(`Unable to retrieve ${params.strapiEntityType}, ${params.id ?? 'any'}`);
			return { data: undefined, status: 404, meta: undefined };
		}
	}

	async createProductTypeInStrapi(productTypeId: string, authInterface: AuthInterface): Promise<StrapiResult> {
		return await this.createEntityInStrapi({
			id: productTypeId,
			authInterface: authInterface,

			strapiEntityType: 'product-types',
			medusaService: this.productTypeService_,
			selectFields: ['id', 'value'],
			relations: [],
		});
	}

	async createProductInStrapi(productId, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = (await this.getType('products', authInterface)) ? true : false;
		if (!hasType) {
			return Promise.resolve({
				status: 400,
			});
		}

		// eslint-disable-next-line no-useless-catch
		try {
			const product = await this.productService_.retrieve(productId, {
				relations: [
					'options',
					'variants',
					'variants.prices',
					'variants.options',
					'type',
					'collection',
					'categories',
					'tags',
					'images',
				],
				select: [
					'id',
					'title',
					'subtitle',
					'description',
					'handle',
					'is_giftcard',
					'discountable',
					'thumbnail',
					'weight',
					'length',
					'height',
					'width',
					'hs_code',
					'origin_country',
					'mid_code',
					'material',
					'metadata',
				],
			});

			/**
			 * Todo implement schema validator
			 */
			if (product) {
				const productToSend = _.cloneDeep(product);
				productToSend['product-type'] = _.cloneDeep(productToSend.type);
				delete productToSend.type;
				productToSend['product-tags'] = _.cloneDeep(productToSend.tags);
				delete productToSend.tags;
				productToSend['product-options'] = _.cloneDeep(productToSend.options);
				delete productToSend.options;
				productToSend['product-variants'] = _.cloneDeep(productToSend.variants);
				delete productToSend.variants;

				productToSend['product-collection'] = _.cloneDeep(productToSend.collection);
				delete productToSend.collection;

				productToSend['product-categories'] = _.cloneDeep(productToSend.categories);
				delete productToSend.categories;

				const result = await this.createEntryInStrapi({
					type: 'products',
					authInterface,
					data: productToSend,
					method: 'POST',
				});
				return result;
			}
		} catch (error) {
			throw error;
		}
	}

	async updateCollectionInStrapi(data, authInterface: AuthInterface): Promise<StrapiResult> {
		const updateFields = ['handle', 'title'];

		// Update came directly from product collection service so only act on a couple
		// of fields. When the update comes from the product we want to ensure
		// references are set up correctly so we run through everything.
		if (data.fields) {
			const found =
				data.fields.find((f) => updateFields.includes(f)) || this.verifyDataContainsFields(data, updateFields);
			if (!found) {
				return { status: 400 };
			}
		}

		try {
			const ignore = await this.shouldIgnore_(data.id, 'strapi');
			if (ignore) {
				return { status: 400 };
			}

			const collection = await this.productCollectionService.retrieve(data.id, {
				relations: ['products'],
			});

			if (collection) {
				// Update entry in Strapi
				const response = await this.updateEntryInStrapi({
					type: 'product-collections',
					id: collection.id,
					authInterface,
					data: { ...collection, ...data },
					method: 'put',
				});
				this.logger.info(`Successfully updated collection ${collection.id} in Strapi`, {
					'response.status': response.status,
					'response.data': response.data,
					'entity.id': collection.id,
				});
				return response;
			}

			return { status: 400 };
		} catch (error) {
			this.logger.info('Failed to update product collection', {
				'entity.id': data.id,
				'error.message': error.message,
			});
			return { status: 400 };
		}
	}

	async createCollectionInStrapi(collectionId: string, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('product-collections', authInterface)
			.then(() => true)
			.catch(() => false);

		if (!hasType) {
			return Promise.resolve({
				status: 400,
			});
		}
		try {
			const collection = await this.productCollectionService.retrieve(collectionId);

			// this.logger.info(variant)
			if (collection) {
				const collectionToSend = _.cloneDeep(collection);

				const result = await this.createEntryInStrapi({
					type: 'product-collections',
					id: collectionId,
					authInterface,
					data: collectionToSend,
					method: 'POST',
				});
				return result;
			}
		} catch (error) {
			this.logger.error(`unable to create collection ${collectionId} ${error.message}`);
		}
	}

	async updateCategoryInStrapi(data, authInterface: AuthInterface): Promise<StrapiResult> {
		const updateFields = ['handle', 'name'];

		// Update came directly from product category service so only act on a couple
		// of fields. When the update comes from the product we want to ensure
		// references are set up correctly so we run through everything.
		if (data.fields) {
			const found =
				data.fields.find((f) => updateFields.includes(f)) || this.verifyDataContainsFields(data, updateFields);
			if (!found) {
				return { status: 400 };
			}
		}

		try {
			const ignore = await this.shouldIgnore_(data.id, 'strapi');
			if (ignore) {
				return { status: 400 };
			}

			const category = await this.productCategoryService.retrieve(data.id);

			if (category) {
				// Update entry in Strapi
				const response = await this.updateEntryInStrapi({
					type: 'product-categories',
					id: category.id,
					authInterface,
					data: { ...category, ...data },
					method: 'put',
				});
				this.logger.info(`Successfully updated category ${category.id} in Strapi`, {
					'response.status': response.status,
					'response.data': response.data,
					'entity.id': category.id,
				});
				return response;
			}

			return { status: 400 };
		} catch (error) {
			this.logger.info('Failed to update product category', {
				'entity.id': data.id,
				'error.message': error.message,
			});
			return { status: 400 };
		}
	}

	async createCategoryInStrapi(categoryId: string, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('product-categories', authInterface)
			.then(() => true)
			.catch(() => false);

		if (!hasType) {
			return Promise.resolve({
				status: 400,
			});
		}
		try {
			const category = await this.productCategoryService.retrieve(categoryId);

			if (category) {
				const categoryToSend = _.cloneDeep(category);

				const result = await this.createEntryInStrapi({
					type: 'product-categories',
					id: categoryId,
					authInterface,
					data: categoryToSend,
					method: 'POST',
				});
				return result;
			}
		} catch (error) {
			this.logger.error(`unable to create category ${categoryId} ${error.message}`);
		}
	}

	async createProductVariantInStrapi(variantId, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('product-variants', authInterface)
			.then(() => true)
			.catch(() => false);

		if (!hasType) {
			return Promise.resolve({
				status: 400,
			});
		}

		// eslint-disable-next-line no-useless-catch
		try {
			const variant = await this.productVariantService_.retrieve(variantId, {
				relations: ['prices', 'options', 'product'],
			});

			// this.logger.info(variant)
			if (variant) {
				const variantToSend = _.cloneDeep(variant);
				variantToSend['money-amount'] = _.cloneDeep(variantToSend.prices);
				delete variantToSend.prices;

				/* const variantOptionValues = variantToSend.options;
				 for (const variantOption of variantOptionValues) {
					this.convertOptionValueToMedusaReference(variantOption);
				}*/

				variantToSend['product-option-value'] = _.cloneDeep(variantToSend.options);

				return await this.createEntryInStrapi({
					type: 'product-variants',
					id: variantId,
					authInterface,
					data: variantToSend,
					method: 'POST',
				});
			}
		} catch (error) {
			throw error;
		}
	}

	convertOptionValueToMedusaReference(data): Record<string, any> {
		const keys = Object.keys(data);
		for (const key of keys) {
			if (key != 'medusa_id' && key.includes('_id')) {
				const medusaService = key.split('_')[0];
				const api = `product-${medusaService}`;
				const value = data[key];

				data[api] = {
					medusa_id: value,
				};
			}
		}
		return data;
	}

	async createRegionInStrapi(regionId, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('regions', authInterface)
			.then(() => true)
			.catch(() => false);
		if (!hasType) {
			this.logger.info('Type "Regions" doesnt exist in Strapi');
			return { status: 400 };
		}

		// eslint-disable-next-line no-useless-catch
		try {
			const region = await this.regionService_.retrieve(regionId, {
				relations: ['	', 'payment_providers', 'fulfillment_providers', 'currency'],
				select: ['id', 'name', 'tax_rate', 'tax_code', 'metadata'],
			});

			// this.logger.info(region)

			return await this.createEntryInStrapi({
				type: 'regions',
				id: regionId,
				authInterface,
				data: region,
				method: 'post',
			});
		} catch (error) {
			throw error;
		}
	}

	async updateRegionInStrapi(data, authInterface: AuthInterface = this.defaultAuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('regions', authInterface)
			.then(() => {
				// this.logger.info(res.data)
				return true;
			})
			.catch(() => {
				// this.logger.info(error.response.status)
				return false;
			});
		if (!hasType) {
			return { status: 400 };
		}

		const updateFields = ['name', 'currency_code', 'countries', 'payment_providers', 'fulfillment_providers'];

		// check if update contains any fields in Strapi to minimize runs
		const found = this.verifyDataContainsFields(data, updateFields);
		if (!found) {
			return { status: 400 };
		}

		// eslint-disable-next-line no-useless-catch
		try {
			const ignore = await this.shouldIgnore_(data.id, 'strapi');
			if (ignore) {
				return { status: 400 };
			}

			const region = await this.regionService_.retrieve(data.id, {
				relations: ['countries', 'payment_providers', 'fulfillment_providers', 'currency'],
				select: ['id', 'name', 'tax_rate', 'tax_code', 'metadata'],
			});
			// this.logger.info(region)

			if (region) {
				// Update entry in Strapi
				const response = await this.updateEntryInStrapi({
					type: 'regions',
					id: region.id,
					authInterface,
					data: { ...region, ...data },
				});
				this.logger.info('Region Strapi Id - ', response);
				return response;
			} else {
				return { status: 400 };
			}
		} catch (error) {
			return { status: 400 };
			throw error;
		}
	}
	/**
	 * Product metafields id is the same as product id
	 * @param data
	 * @param authInterface
	 * @returns
	 */

	async createProductMetafieldInStrapi(
		data: { id: string; value: Record<string, unknown> },
		authInterface: AuthInterface = this.defaultAuthInterface
	): Promise<StrapiResult> {
		const typeExists = await this.checkType('product-metafields', authInterface);
		if (!typeExists) {
			return { status: 400 };
		}

		const productInfo = await this.productService_.retrieve(data.id);
		const dataToInsert: BaseEntity = {
			..._.cloneDeep(data),
			created_at: productInfo.created_at,
			updated_at: productInfo.updated_at,
		};

		return await this.createEntryInStrapi({
			type: 'product-metafields',
			id: data.id,
			authInterface,
			data: dataToInsert,
			method: 'post',
		});
	}

	async updateProductMetafieldInStrapi(
		data: { id: string; value: Record<string, unknown> },
		authInterface: AuthInterface
	): Promise<StrapiResult> {
		const typeExists = await this.checkType('product-metafields', authInterface);
		if (!typeExists) {
			return { status: 400 };
		}

		const productInfo = await this.productService_.retrieve(data.id);
		const dataToUpdate: BaseEntity & { medusa_id: string } = {
			..._.cloneDeep(data),
			created_at: productInfo.created_at,
			updated_at: productInfo.updated_at,
			medusa_id: data.id.toString(),
		};
		delete dataToUpdate.id;
		return await this.updateEntryInStrapi({
			type: 'product-metafields',
			id: data.id,
			authInterface,
			data: { ...productInfo, ...dataToUpdate },
			method: 'put',
		});
	}

	async updateProductsWithinCollectionInStrapi(
		data,
		authInterface: AuthInterface = this.defaultAuthInterface
	): Promise<StrapiResult> {
		const hasType = this.getType('products', authInterface)
			.then(() => {
				return true;
			})
			.catch(() => {
				return false;
			});
		if (!hasType) {
			return { status: 400 };
		}

		const updateFields = ['productIds', 'productCollection'];

		if (!this.verifyDataContainsFields(data, updateFields)) {
			return { status: 400 };
		}
		try {
			for (const productId of data.productIds) {
				const ignore = await this.shouldIgnore_(productId, 'strapi');
				if (ignore) {
					this.logger.info(
						'Strapi has just added this product to collection which triggered this function. IGNORING... '
					);
					continue;
				}

				const product = await this.productService_.retrieve(productId, {
					relations: ['collection'],
					select: ['id'],
				});

				if (product) {
					// we're sending requests sequentially as the Strapi is having problems with deadlocks otherwise
					await this.adjustProductAndUpdateInStrapi(product, data, authInterface);
				}
			}
			return { status: 200 };
		} catch (error) {
			this.logger.error('Error updating products in collection', error);
			throw error;
		}
		return { status: 400 };
	}

	async updateProductInStrapi(data, authInterface: AuthInterface = this.defaultAuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('products', authInterface)
			.then(() => {
				// this.logger.info(res.data)
				return true;
			})
			.catch(() => {
				// this.logger.info(error.response.status)
				return false;
			});
		if (!hasType) {
			return { status: 400 };
		}

		// this.logger.info(data)
		const updateFields = [
			'variants',
			'options',
			'categories',
			'tags',
			'title',
			'subtitle',
			'tags',
			'type',
			'type_id',
			'collection',
			'collection_id',
			'thumbnail',
		];

		// check if update contains any fields in Strapi to minimize runs
		const found = this.verifyDataContainsFields(data, updateFields);
		if (!found) {
			return { status: 400 };
		}

		// eslint-disable-next-line no-useless-catch
		try {
			const ignore = await this.shouldIgnore_(data.id, 'strapi');
			if (ignore) {
				this.logger.info(
					'Strapi has just updated this product' + ' which triggered this function. IGNORING... '
				);
				return { status: 400 };
			}
			const product = await this.productService_.retrieve(data.id, {
				relations: [
					'options',
					'variants',
					'variants.prices',
					'variants.options',
					'type',
					'collection',
					'tags',
					'images',
				],
				select: [
					'id',
					'title',
					'subtitle',
					'description',
					'handle',
					'is_giftcard',
					'discountable',
					'thumbnail',
					'weight',
					'length',
					'height',
					'width',
					'hs_code',
					'origin_country',
					'mid_code',
					'material',
					'metadata',
				],
			});

			if (product) {
				return await this.adjustProductAndUpdateInStrapi(product, data, authInterface);
			}
			return { status: 400 };
		} catch (error) {
			throw error;
		}
	}

	private async adjustProductAndUpdateInStrapi(product: Product, data, authInterface: AuthInterface) {
		// Medusa is not using consistent naming for product-*.
		// We have to adjust it manually. For example: collection to product-collection
		const dataToUpdate = { ...product, ...data };

		const keysToUpdate = ['collection', 'categories', 'type', 'tags', 'variants', 'options'];
		for (const key of keysToUpdate) {
			if (key in dataToUpdate) {
				dataToUpdate[`product-${key}`] = dataToUpdate[key];
				delete dataToUpdate[key];
			}
		}

		const response = await this.updateEntryInStrapi({
			type: 'products',
			id: product.id,
			authInterface,
			data: dataToUpdate,
			method: 'put',
		});
		return response;
	}

	async checkType(type, authInterface): Promise<boolean> {
		let result: StrapiResult;
		try {
			result = await this.getType(type, authInterface);
		} catch (error) {
			this.logger.error(`${type} type not found in strapi`);
			this.logger.error(JSON.stringify(error));
			result = undefined;
		}
		return result ? true : false;
	}

	async updateProductVariantInStrapi(data, authInterface: AuthInterface): Promise<StrapiResult> {
		const updateFields = [
			'title',
			'prices',
			'sku',
			'material',
			'weight',
			'length',
			'height',
			'origin_country',
			'options',
		];

		// Update came directly from product variant service so only act on a couple
		// of fields. When the update comes from the product we want to ensure
		// references are set up correctly so we run through everything.
		if (data.fields) {
			const found =
				data.fields.find((f) => updateFields.includes(f)) || this.verifyDataContainsFields(data, updateFields);
			if (!found) {
				return { status: 400 };
			}
		}

		try {
			const ignore = await this.shouldIgnore_(data.id, 'strapi');
			if (ignore) {
				return { status: 400 };
			}

			const variant = await this.productVariantService_.retrieve(data.id, {
				relations: ['prices', 'options'],
			});
			this.logger.info(JSON.stringify(variant));

			if (variant) {
				// Update entry in Strapi
				const response = await this.updateEntryInStrapi({
					type: 'product-variants',
					id: variant.id,
					authInterface,
					data: { ...variant, ...data },
					method: 'put',
				});
				this.logger.info('Variant Strapi Id - ', response);
				return response;
			}

			return { status: 400 };
		} catch (error) {
			this.logger.info('Failed to update product variant', data.id);
			return { status: 400 };
		}
	}

	async deleteProductMetafieldInStrapi(data: { id: string }, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('product-metafields', authInterface)
			.then(() => true)
			.catch((err) => {
				this.logger.info(err);
				return false;
			});
		if (!hasType) {
			return Promise.resolve({
				status: 400,
			});
		}
		const ignore = await this.shouldIgnore_(data.id, 'strapi');
		if (ignore) {
			return { status: 400 };
		}

		return await this.deleteEntryInStrapi({
			type: 'product-metafields',
			id: data.id,
			authInterface,
			method: 'delete',
		});
	}

	async deleteProductInStrapi(data, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('products', authInterface)
			.then(() => true)
			.catch((err) => {
				this.logger.info(err);
				return false;
			});
		if (!hasType) {
			return Promise.resolve({
				status: 400,
			});
		}

		const ignore = await this.shouldIgnore_(data.id, 'strapi');
		if (ignore) {
			return { status: 400 };
		}

		return await this.deleteEntryInStrapi({
			type: 'products',
			id: data.id,
			authInterface,
			method: 'delete',
		});
	}

	async deleteProductTypeInStrapi(data, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('product-types', authInterface)
			.then(() => true)
			.catch((err) => {
				this.logger.info(err);
				return false;
			});
		if (!hasType) {
			return { status: 400 };
		}

		const ignore = await this.shouldIgnore_(data.id, 'strapi');
		if (ignore) {
			return { status: 400 };
		}

		return await this.deleteEntryInStrapi({
			type: 'product-types',
			id: data.id,
			authInterface,
			method: 'delete',
		});
	}

	async deleteProductVariantInStrapi(data, authInterface: AuthInterface): Promise<StrapiResult> {
		const hasType = this.getType('product-variants', authInterface)
			.then(() => true)
			.catch(() => {
				// this.logger.info(err)
				return false;
			});
		if (!hasType) {
			return { status: 400 };
		}

		const ignore = await this.shouldIgnore_(data.id, 'strapi');
		if (ignore) {
			return { status: 400 };
		}

		return await this.deleteEntryInStrapi({
			type: 'product-variants',
			id: data.id,
			authInterface,
			method: 'delete',
		});
	}

	// Blocker - Delete Region API
	async deleteRegionInStrapi(data, authInterface): Promise<StrapiResult> {
		const hasType = this.getType('regions', authInterface)
			.then(() => true)
			.catch(() => {
				// this.logger.info(err)
				return false;
			});
		if (!hasType) {
			return { status: 400 };
		}

		const ignore = await this.shouldIgnore_(data.id, 'strapi');
		if (ignore) {
			return { status: 400 };
		}

		return await this.deleteEntryInStrapi({
			type: 'regions',
			id: data.id,
			authInterface,
			method: 'delete',
		});
	}

	async deleteCollectionInStrapi(data, authInterface): Promise<StrapiResult> {
		const hasType = this.getType('product-collections', authInterface)
			.then(() => true)
			.catch(() => {
				// this.logger.info(err)
				return false;
			});
		if (!hasType) {
			return { status: 400 };
		}

		const ignore = await this.shouldIgnore_(data.id, 'strapi');
		if (ignore) {
			return { status: 400 };
		}

		return await this.deleteEntryInStrapi({
			type: 'product-collections',
			id: data.id,
			authInterface,
			method: 'delete',
		});
	}
	async deleteCategoryInStrapi(data, authInterface): Promise<StrapiResult> {
		const hasType = this.getType('product-categories', authInterface)
			.then(() => true)
			.catch(() => {
				// this.logger.info(err)
				return false;
			});
		if (!hasType) {
			return { status: 400 };
		}

		const ignore = await this.shouldIgnore_(data.id, 'strapi');
		if (ignore) {
			return { status: 400 };
		}

		return await this.deleteEntryInStrapi({
			type: 'product-categories',
			id: data.id,
			authInterface,
			method: 'delete',
		});
	}

	async getType(type: string, authInterface: AuthInterface): Promise<StrapiResult> {
		const result = await this.strapiSendDataLayer({
			method: 'get',
			type,
			authInterface,
		});
		return result;
	}

	private async executeStrapiHealthCheck(): Promise<boolean> {
		const config = {
			url: `${this.strapi_url}/_health`,
		};
		this.logger.info(`Checking Strapi Health `);
		if (process.env.NODE_ENV == 'test' && this.selfTestMode) {
			this.logger.info('running in self test mode');
			return true;
		}

		this.logger.debug(`check-url: ${config.url} `);

		try {
			let response = undefined;
			let timeOut = this.options_.strapi_healthcheck_timeout ?? 120e3;
			while (timeOut-- > 0) {
				try {
					response = await axios.head(config.url);
				} catch (e) {
					this.logger.error(`health check error ${e.message}`);
				}
				if (response && response?.status) {
					break;
				}
				this.logger.error(`response from the server: ${response?.status ?? 'no-response'}`);
				await sleep(3000);
			}
			UpdateStrapiService.lastHealthCheckTime = Date.now();
			if (response) {
				UpdateStrapiService.isHealthy = response.status < 300 ? true : false;
				if (UpdateStrapiService.isHealthy) {
					this.logger.info('Strapi is healthy');
				} else {
					this.logger.info('Strapi is unhealthy');
				}
			} else {
				UpdateStrapiService.isHealthy = false;
			}

			return UpdateStrapiService.isHealthy;
		} catch (error) {
			this.logger.error('Strapi health check failed');
			UpdateStrapiService.isHealthy = false;
			return false;
		}
	}

	async checkStrapiHealth(): Promise<boolean> {
		const currentTime = Date.now();

		const timeInterval = this.options_.strapi_healthcheck_timeout ?? 120e3;
		const timeDifference = currentTime - (UpdateStrapiService.lastHealthCheckTime ?? 0);
		const intervalElapsed = timeDifference > timeInterval;

		if (!UpdateStrapiService.isHealthy) {
			/** clearing tokens if the health check fails dirty */
			this.userTokens = Object.assign(this.userTokens, {});
			this.strapiSuperAdminAuthToken = undefined;
		}

		if (process.env.NODE_ENV == 'test' && this.selfTestMode) {
			return true;
		}
		const result =
			intervalElapsed || !UpdateStrapiService.isHealthy
				? await this.executeStrapiHealthCheck()
				: UpdateStrapiService.isHealthy; /** sending last known health status */

		return result;
	}
	/**
	 *
	 * @param text the text to encrpyt
	 * @returns encrypted text
	 */
	encrypt(text: string): string {
		return text;
	}
	/**
	 * @todo  implement decryption
	 * @param text
	 * @returns
	 */

	// Decrypting text
	decrypt(text): string {
		return text;
	}
	/**
	 *
	 * @returns the default user  - service account for medusa requests
	 */
	async registerDefaultMedusaUser(): Promise<{ id: string }> {
		try {
			const authParams = {
				...this.options_.strapi_default_user,
			};
			const registerResponse = await this.executeRegisterMedusaUser(authParams);
			return registerResponse?.data;
		} catch (error) {
			this.logger.error('unable to register default user', (error as Error).message);
		}
	}
	/**
	 * Deletes the service account
	 * @returns the deleted default user
	 */

	async deleteDefaultMedusaUser(): Promise<StrapiResult> {
		try {
			const response = await this.deleteMedusaUserFromStrapi(this.defaultAuthInterface);

			delete this.userTokens[this.defaultAuthInterface.email];
			return response;
		} catch (error) {
			this.logger.error('unable to delete default user: ' + (error as Error).message);
		}
	}

	/**
	 * Deletes a medusa user from strapi
	 * @param authInterface - the user authorisation parameters
	 * @returns
	 */

	async deleteMedusaUserFromStrapi(authInterface: AuthInterface): Promise<StrapiResult> {
		const fetchedUser = await this.strapiSendDataLayer({
			method: 'get',
			type: 'users',
			id: 'me',
			data: undefined,
			authInterface,
		});

		this.logger.info('found user: ' + JSON.stringify(fetchedUser));

		const result = await this.executeStrapiSend(
			'delete',
			'users',
			this.userTokens[authInterface.email].token,
			fetchedUser.id?.toString()
		);
		return { data: result.data.data ?? result.data, status: result.status };
	}

	/**
	 * @Todo Create API based access
  async fetchMedusaUserApiKey(emailAddress) {

	return await this.strapiAdminSend("get")
  }

  */

	async executeSync(token: string): Promise<AxiosResponse> {
		await this.waitForHealth();
		try {
			const result = await axios.post(
				`${this.strapi_url}/strapi-plugin-medusajs/synchronise-medusa-tables`,
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
					timeout: 3600e3 /** temp workaround to stop retransmissions over 900ms*/,
				}
			);
			this.logger.info('successfully initiated two way syncs trapi<-->medusa');
			return result;
		} catch (error) {
			this._axiosError(
				error,
				undefined,
				undefined,
				undefined,
				undefined,
				`${this.strapi_url}/strapi-plugin-medusajs/synchronise-medusa-tables`
			);
		}
	}

	/**
	 * Readies the server to be used with a service account
	 */

	async configureStrapiMedusaForUser(authInterface: AuthInterface): Promise<StrapiResult> {
		const { email } = authInterface;
		try {
			const jwt = (await this.strapiLoginSendDatalayer(authInterface)).token;
			if (!jwt) {
				this.logger.error('no jwt for this user: ' + email);
				return { status: 400 };
			}
			const result = await this.executeSync(jwt);
			return { status: result.status };
		} catch (error) {
			// Handle error.
			this.logger.info('Unable to sync An error occurred:', error);
			return { status: 400 };
		}
	}

	async retrieveRefreshedToken(authInterface: AuthInterface, errorCode?: string | number) {
		const { email } = authInterface;
		const currentTime = Date.now();
		const lastRetrived = this.userTokens[email.toLowerCase()];
		if (lastRetrived && errorCode != '401') {
			if (!strapiRetryDelay) {
				strapiRetryDelay = 180e3;
			}
			const diff = Math.floor(currentTime / 1000) - Math.floor((lastRetrived.time ?? 0) / 1000);
			if (diff < strapiRetryDelay) {
				this.logger.debug('using cached user credentials ');
				return lastRetrived;
			}
		}
		try {
			const res = await this.executeLoginAsStrapiUser(authInterface);
			if (res?.data.jwt) {
				this.userTokens[email.toLowerCase()] = {
					token: res.data.jwt /** caching the jwt token */,
					time: Date.now(),
					user: res.data.user,
				};
				this.logger.info(`${email} ` + 'successfully logged in to Strapi');
				return this.userTokens[email.toLowerCase()];
			}
		} catch (error) {
			this.logger.error(`${email} ` + 'error logging in in to Strapi');
			this._axiosError(error);
		}
	}

	async strapiLoginSendDatalayer(
		authInterface: AuthInterface = {
			email: this.defaultUserEmail,
			password: this.defaultUserPassword,
		}
	): Promise<UserCreds> {
		const refreshedCredentials = await this.retrieveRefreshedToken(authInterface);
		return refreshedCredentials;
	}

	async executeLoginAsStrapiUser(
		authInterface: AuthInterface = {
			email: this.defaultUserEmail,
			password: this.defaultUserPassword,
		}
	): Promise<AxiosResponse> {
		await this.waitForHealth();
		try {
			const authData = {
				identifier: authInterface.email.toLowerCase(),
				password: authInterface.password,
			};
			this.logger.info(`firing: ${this.strapi_url}/api/auth/local`);
			const response = await axios.post(`${this.strapi_url}/api/auth/local`, authData);
			// } catch (e) {
			/* if (e.response.status == 429) {
					let i = 0;
					let timeOut: NodeJS.Timeout;
					while (i++ < 60000) {
						if (timeOut) {
							clearTimeout(timeOut);
							this.logger.info(
								`429 recieved backing off  seconds: ${timeOut} remaining`
							);
						}
						timeOut = setTimeout(async () => {
							res = await axios.post(
								`${this.strapi_url}/api/auth/local`,
								authData
							);
						}, 60000 - i);
					}
				}*/
			// }
			// console.log("login result"+res);
			return response;
		} catch (error) {
			this._axiosError(error, undefined, undefined, undefined, undefined, `${this.strapi_url}/api/auth/local`);
			throw new Error(
				`\n Error  ${authInterface.email} while trying to login to strapi\n` + (error as Error).message
			);
		}

		return;
	}
	async getRoleId(requestedRole: string): Promise<number> {
		const response = await this.executeStrapiAdminSend('get', 'roles');
		let idToReturn = -1;
		// console.log("role:", response);
		if (response) {
			const availableRoles = response.data.data as role[];
			const theRole = availableRoles?.filter((role) => role.name == requestedRole);
			/*for (const role of availableRoles) {
				if (role.name == requestedRole) {
					return role.id;
				}
			}*/
			idToReturn = theRole?.[0]?.id ?? -1;
		}
		return idToReturn;
	}
	async processStrapiEntry(command: StrapiSendParams): Promise<StrapiResult> {
		try {
			const result = await this.strapiSendDataLayer(command);
			return result;
		} catch (e) {
			this.logger.error('Unable to process strapi entry request: ' + e.message);
			return { status: 400, data: undefined };
		}
	}

	async doesEntryExistInStrapi(
		type: string,
		id: string,

		authInterface: AuthInterface
	): Promise<StrapiResult> {
		return await this.processStrapiEntry({
			method: 'get',
			type,
			id,
			authInterface,
		});
	}

	async createEntryInStrapi(command: StrapiSendParams): Promise<StrapiResult> {
		let result: StrapiGetResult;
		try {
			/** to check if the request field already exists */
			result = await this.getEntriesInStrapi({
				type: command.type,
				method: 'get',
				id: command.data.id,
				data: undefined,
				authInterface: command.authInterface,
			});
			if (result.data?.length > 0 && result.status == 200) {
				if (result.data[0]) {
					return {
						status: result.status == 200 ? 302 : 400,
						data: result.data[0],
					};
				}
			}
		} catch (e) {
			this.logger.info(e.message);
		}

		const createResponse = await this.processStrapiEntry({
			...command,
			method: 'post',
		});

		return createResponse;
	}
	async getEntriesInStrapi(command: StrapiSendParams): Promise<StrapiGetResult> {
		const result = await this.processStrapiEntry({
			...command,
			method: 'get',
		});
		return {
			data: _.isArray(result.data) ? [...result.data] : [result.data],
			meta: result?.meta,
			status: result.status,
		};
	}

	async updateEntryInStrapi(command: StrapiSendParams): Promise<StrapiResult> {
		try {
			const result = await this.getEntriesInStrapi({
				type: command.type,
				method: 'get',
				id: command.data.id,
				data: undefined,
				authInterface: command.authInterface,
			});
			return await this.processStrapiEntry({
				...command,
				method: 'put',
			});
		} catch (e) {
			this.logger.error(
				`entity doesn't exist in strapi :${e.message} : ${command.id}` + ' , update not possible'
			);
		}
	}

	async deleteEntryInStrapi(command: StrapiSendParams): Promise<StrapiResult> {
		return await this.processStrapiEntry({
			...command,
			method: 'delete',
		});
	}

	private isEntity(data: any): boolean {
		return data instanceof Object && ('id' in data || 'medusa_id' in data);
	}

	// Medusa is using underscores to represent relations between entities, strapi is using dashes.
	// This library is translating it in some places but omitting others, this method is providing automatic translation
	// on every sent request.
	private translateRelationNamesToStrapiFormat(dataToSend: StrapiEntity, key: string): StrapiEntity {
		let testObject = null;

		if (_.isArray(dataToSend[key])) {
			if (dataToSend[key].length > 0) {
				testObject = dataToSend[key][0];
			}
		} else {
			testObject = dataToSend[key];
		}

		// if the object is a not empty array or object without id or medusa_id, it's not relation
		if (testObject && !this.isEntity(testObject)) {
			return dataToSend;
		}

		if (key.includes('_')) {
			dataToSend[key.replace('_', '-')] = dataToSend[key];
			delete dataToSend[key];
		}

		return dataToSend;
	}

	translateDataToStrapiFormat(dataToSend: StrapiEntity): StrapiEntity {
		const keys = Object.keys(dataToSend);
		const keysToIgnore = ['id', 'created_at', 'updated_at', 'deleted_at'];

		for (const key of keys) {
			if (_.isArray(dataToSend[key])) {
				for (const element of dataToSend[key]) {
					this.isEntity(element) && this.translateDataToStrapiFormat(element);
				}
				this.translateRelationNamesToStrapiFormat(dataToSend, key);
			}

			if (dataToSend[key] instanceof Object && this.isEntity(dataToSend[key])) {
				this.translateDataToStrapiFormat(dataToSend[key]);
				this.translateRelationNamesToStrapiFormat(dataToSend, key);
			} else if (key == 'id') {
				dataToSend['medusa_id'] = dataToSend[key];
			}

			if (this.isEntity(dataToSend) && keysToIgnore.includes(key)) {
				delete dataToSend[key];
			}
		}
		return dataToSend as BaseEntity & { medusa_id?: string };
	}

	/* using cached tokens */
	/* @todo enable api based access */
	/* automatically converts "id" into medusa "id"*/
	async strapiSendDataLayer(params: StrapiSendParams): Promise<StrapiResult> {
		const { method, type, id, data, authInterface } = params;

		const userCreds = await this.strapiLoginSendDatalayer(authInterface);
		if (!userCreds) {
			this.logger.error(`no such user:${authInterface.email}`);
			return { status: 400 };
		}
		let dataToSend: BaseEntity & { medusa_id?: string };
		if (data && data.id) {
			dataToSend = _.cloneDeep(data);
			dataToSend = this.translateDataToStrapiFormat(dataToSend);
		} else {
			dataToSend = data;
		}

		try {
			const result = await this.executeStrapiSend(method, type, userCreds.token, id, { data: dataToSend });
			return {
				id: result.data.id ?? result.data.data?.id,
				medusa_id: result.data.medusa_id ?? result.data.data?.medusa_id,
				status: result.status,
				data: result.data.data ?? result.data,
			};
		} catch (e) {
			if (e instanceof LoginTokenExpiredError) {
				await this.retrieveRefreshedToken(authInterface, '401');
				return this.strapiSendDataLayer(params);
			}
			this.logger.error(e.message);
			return { status: 400 };
		}
	}
	/**
	 * Blocks the process until strapi is healthy
	 *
	 *
	 */

	async waitForHealth(): Promise<void> {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const health = await this.checkStrapiHealth();
			if (health) {
				break;
			}
			this.logger.debug('Awaiting Strapi Health');

			await sleep(1000);
		}
	}

	async executeStrapiSend(
		method: Method,
		type: string,
		token: string,
		id?: string,
		data?: any
	): Promise<AxiosResponse> {
		let endPoint: string = undefined;
		await this.waitForHealth();
		if (method != 'POST' && method != 'post') {
			endPoint = `${this.strapi_url}/api/${type}${id ? '/' + id : '/'}`;
		} else {
			endPoint = `${this.strapi_url}/api/${type}`;
		}
		this.logger.info(`User endpoint: ${endPoint}`);
		const basicConfig = {
			method: method,
			url: endPoint,
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		this.logger.info(`${basicConfig.method} ${basicConfig.url}`);
		const config = data
			? {
					...basicConfig,
					data,
			  }
			: {
					...basicConfig,
			  };

		try {
			this.logger.info(`User Endpoint firing: ${endPoint}`);
			const result = await axios(config);
			this.logger.info(`User Endpoint fired: ${endPoint}`);
			// console.log("attempting action:"+result);
			if (result.status >= 200 && result.status < 300) {
				this.logger.info(
					`Strapi Ok : method: ${method}, id:${id}, type:${type}, data:${JSON.stringify(data)}, :status:${
						result.status
					}`
				);
			}

			return result;
		} catch (error) {
			this._axiosError(error, id, type, data, method, endPoint);
		}
	}
	_axiosError(error: AxiosError, id?: string, type?: string, data?: any, method?: Method, endPoint?: string): void {
		if (endPoint) {
			this.logger.info(`Endpoint Attempted: ${endPoint}`);
		}
		try {
			if (error?.response?.status != 200) {
				const errorCode = error?.response?.status ?? 'none';
				switch (errorCode) {
					case 401:
						throw new LoginTokenExpiredError({
							error,
							response: error.response,
							id,
							type,
							data,
							method,
							time: new Date(),
						});
						break;

					default:
						throw error;
				}
			}
		} catch (e) {
			if (e instanceof LoginTokenExpiredError) throw e;
			else this.handleError(error, id, type, data, method, endPoint);
		}
	}
	async refreshResend(error: any, id: string, type: string, data: any, method: string, endPoint: string) {
		const credentials = await this.strapiLoginSendDatalayer();
	}

	handleError(error: any, id?: string, type?: string, data?: any, method?: Method, endPoint?: string) {
		const theError = `${(error as Error).message} `;
		const responseData = _.isEmpty(data) ? {} : error?.response?.data ?? 'none';
		this.logger.error('Error occur while sending request to strapi', {
			'error.message': theError,
			request: {
				url: endPoint || 'none',
				data: JSON.stringify(data) || 'none',
				method: method || 'none',
			},
			response: {
				body: JSON.stringify(responseData),
				status: error?.response?.status ?? 'none',
			},
		});

		if (!endPoint?.includes('register-admin')) {
			throw new Error(
				`Error while trying ${method}` +
					`,${type ?? ''} -  ${id ? `id: ${id}` : ''}  ,
                }  entry in strapi ${theError}`
			);
		}
	}
	async executeStrapiAdminSend(
		method: Method,
		type: string,
		id?: string,
		action?: string,
		data?: any,
		query?: string
	): Promise<AxiosResponse | undefined> {
		const result = await this.executeLoginAsStrapiSuperAdmin();
		if (!result) {
			this.logger.error('No user Bearer token, check axios request');
			return;
		}

		let headers = undefined;
		/** refreshed token */
		this.strapiSuperAdminAuthToken = result.data.token;
		if (this.strapiSuperAdminAuthToken) {
			headers = {
				Authorization: `Bearer ${this.strapiSuperAdminAuthToken}`,
				'Content-type': 'application/json',
			};
		}
		const path = [];
		const items = [type, action, id];
		for (const item of items) {
			if (item) {
				path.push(item);
			}
		}
		const q = query ? `?${query}` : '';
		const finalUrl = `${this.strapi_url}/admin/${path.join('/')}${q}`;
		const basicConfig = {
			method: method,
			url: finalUrl,
			headers,
		};
		this.logger.info(`Admin Endpoint fired: ${basicConfig.url}`);
		const config = data
			? {
					...basicConfig,
					data,
			  }
			: {
					...basicConfig,
			  };
		try {
			const result = await axios(config);
			if (result.status >= 200 && result.status < 300) {
				this.logger.info(
					`Strapi Ok : ${method}, ${id ?? ''}` +
						`, ${type ?? ''}, ${this.enableAdminDataLogging ? data ?? '' : ''}, ${action ?? ''} :status:${
							result.status
						}`
				);
				this.logger.info(`Strapi Data : ${JSON.stringify(result.data)}`);
			} else {
				this.logger.info('Admin endpoint error recieved', result);
			}

			return result;
		} catch (error) {
			//  this.logger.error('Admin endpoint error');
			this._axiosError(error, id, type, this.enableAdminDataLogging ? data : {}, method, basicConfig.url);
		}
	}

	async executeRegisterMedusaUser(auth: MedusaUserType): Promise<AxiosResponse | undefined> {
		let response: AxiosResponse;

		try {
			await this.executeLoginAsStrapiSuperAdmin();
			if (!this.selfTestMode) await this.waitForHealth();
		} catch (e) {
			if (this.selfTestMode) this.logger.warn('running in self testmode');
		}

		try {
			response = await axios.post(`${this.strapi_url}/strapi-plugin-medusajs/create-medusa-user`, auth, {
				headers: {
					Authorization: `Bearer ${this.strapiSuperAdminAuthToken}`,
				},
				timeout: 3600e3 /** temp workaround to stop retransmissions over 900ms*/,
			});
		} catch (e) {
			this.logger.error('user registration error');
			this._axiosError(e);
		}

		return response;
	}
	/** *
	 * send the command using elevated privileges
	 */

	async strapiAdminSendDatalayer(command: StrapiAdminSendParams): Promise<AdminResult> {
		const { method, type, id, action, data, query } = command;
		try {
			const result = await this.executeStrapiAdminSend(method, type, id, action, data, query);
			return { data: result.data, status: result.status };
		} catch (e) {
			this.logger.error(e.message);
			return { data: undefined, status: 400 };
		}
	}

	async registerSuperAdminUserInStrapi(): Promise<any> {
		const auth: AdminUserType = {
			...this.options_.strapi_admin,
		};
		try {
			const result = await this.executeStrapiAdminSend('post', 'register-admin', undefined, undefined, auth);
			return result.data?.user;
		} catch (e) {
			this.logger.warn(`unable to register super user,` + ` super user may already registered, ${e.message}`);
		}
	}
	async registerAdminUserInStrapi(
		email: string,
		firstname: string,
		password = passwordGen.generate({
			length: 16,
			numbers: true,
			strict: true,
		}),
		role = 'Author'
	): Promise<AdminResult> {
		const roleId = await this.getRoleId(role);
		const auth = {
			email,
			firstname,
			// password,
			// isActive: true,
			roles: [roleId],
		};

		const result = await this.strapiAdminSendDatalayer({
			method: 'post',
			type: 'users',
			id: undefined,
			// action: "user",
			data: auth,
		});
		return result;
	}

	async updateAdminUserInStrapi(
		email: string,
		firstname: string,
		password = passwordGen.generate({
			length: 16,
			numbers: true,
			strict: true,
		}),
		role = 'Author',
		isActive = true
	): Promise<AdminResult> {
		const userData = await this.getAdminUserInStrapi(email.toLowerCase());
		if (userData) {
			const roleId = await this.getRoleId(role);
			const auth = {
				email: email.toLowerCase(),
				firstname,
				password,
				isActive,
				roles: [roleId],
			};

			return await this.strapiAdminSendDatalayer({
				method: 'put',
				type: 'users',
				id: userData.data.id,
				// action: "user",
				data: auth,
			});
		} else {
			return { data: undefined, status: 400 };
		}
	}

	async getAdminUserInStrapi(email: string): Promise<AdminResult> {
		const userData = await this.strapiAdminSendDatalayer({
			method: 'get',
			type: 'users',
			id: undefined,
			action: undefined,
			query: this._createStrapiRestQuery({
				fields: ['email'],
				filters: {
					email: `${email}`.toLocaleLowerCase(),
				},
			}),
		});
		if (userData.status == 200) {
			return { status: 200, data: userData.data.data.results[0] };
		} else {
			return { status: 400, data: undefined };
		}
	}

	async getAllAdminUserInStrapi(): Promise<AdminResult> {
		return await this.strapiAdminSendDatalayer({
			method: 'get',
			type: 'users',
			id: undefined,
			action: undefined,
		});
	}
	async deleteAdminUserInStrapi(email: string, role = 'Author'): Promise<AdminResult> {
		const user = await this.getAdminUserInStrapi(email);

		return await this.strapiAdminSendDatalayer({
			method: 'delete',
			type: 'users',
			id: user.data.id,
		});
	}

	fetchUserToken(email: string = this.defaultUserEmail): string {
		const token = this.userTokens[email].token;
		if (token) {
			this.logger.info('fetched token for: ' + email);
		}
		return token;
	}
	async executeLoginAsStrapiSuperAdmin(): Promise<{
		data: { user: any; token: string };
	}> {
		const auth = {
			email: this.options_.strapi_admin.email,
			password: this.options_.strapi_admin.password,
		};
		const currentLoginAttempt = Date.now();
		const timeDiff = Math.floor((currentLoginAttempt - (this.lastAdminLoginAttemptTime ?? 0)) / 1000);
		if (strapiRetryDelay && timeDiff < strapiRetryDelay && this.strapiSuperAdminAuthToken) {
			return {
				data: {
					user: this.userAdminProfile,
					token: this.strapiSuperAdminAuthToken,
				},
			};
		}
		this.lastAdminLoginAttemptTime = currentLoginAttempt;
		await this.waitForHealth();
		const adminUrl = `${this.strapi_url}/admin/login`;
		try {
			const response = await axios.post(adminUrl, auth, {
				headers: {
					'Content-Type': 'application/json',
				},
			});

			this.logger.info('Logged In   Admin ' + auth.email + ' with strapi');
			this.logger.info('Admin profile', response.data.data.user);
			this.logger.info('Admin token', response.data.data.token);

			this.strapiSuperAdminAuthToken = response.data.data.token;
			this.userAdminProfile = response.data.data.user;
			return {
				data: {
					user: this.userAdminProfile,
					token: this.strapiSuperAdminAuthToken,
				},
			};
		} catch (error) {
			// Handle error.
			this.logger.info('An error occurred' + ' while logging into admin:');
			this._axiosError(error, undefined, undefined, undefined, undefined, `${this.strapi_url}/admin/login`);

			throw error;
		}
	}
	async intializeServer(): Promise<any> {
		await this.registerOrLoginAdmin();
		if (this.strapiSuperAdminAuthToken) {
			const user = (await this.registerOrLoginDefaultMedusaUser()).user;
			if (user) {
				const response = await this.executeSync(this.strapiSuperAdminAuthToken);
				/* const response = await this.configureStrapiMedusaForUser({
					email: this.options_.strapi_default_user.email,
					password: this.options_.strapi_default_user.password
				});*/
				if (response.status < 300) {
					this.logger.info('medusa - strap -bootstrap confirmed ..please wait till sync completes');
					return response;
				}
			} else {
				this.logger.error('unable to login default user');
			}
		} else {
			this.logger.error('unable to connect as super user');
		}
	}
	async registerOrLoginAdmin(): Promise<{
		data: {
			user: any;
			token: string;
		};
	}> {
		try {
			await this.registerSuperAdminUserInStrapi();
		} catch (e) {
			this.logger.info('super admin already registered', JSON.stringify(e));
		}
		return await this.executeLoginAsStrapiSuperAdmin();
	}

	async loginAsDefaultMedusaUser(): Promise<UserCreds> {
		let userCrds: UserCreds;
		try {
			userCrds = await this.strapiLoginSendDatalayer(this.defaultAuthInterface);

			this.logger.info('Default Medusa User Logged In');
		} catch (error) {
			if (!userCrds) {
				this.logger.error('Unable to login default medusa user: ' + (error as Error).message);
			}
		}
		return userCrds;
	}

	async registerOrLoginDefaultMedusaUser(): Promise<UserCreds> {
		try {
			await this.registerDefaultMedusaUser();
			this.logger.info('registered default user');
		} catch (e) {
			this.logger.info('default user already registered', JSON.stringify(e));
		}
		return await this.loginAsDefaultMedusaUser();
	}
	verifyDataContainsFields(data: any, updateFields: any[]): boolean {
		if (!data || _.isEmpty(data)) return false;
		let found = data.fields?.find((f) => updateFields.includes(f));
		if (!found) {
			try {
				const fieldsOfdata = Object.keys(data);
				found = fieldsOfdata.some((field) => {
					return updateFields.some((uf) => {
						return uf == field;
					});
				});
			} catch (e) {
				this.logger.error(JSON.stringify(e));
			}
		}
		return found;
	}

	_createStrapiRestQuery(strapiQuery: StrapiQueryInterface): string {
		const { sort, filters, populate, fields, pagination, publicationState, locale } = strapiQuery;

		const query = qs.stringify(
			{
				sort,
				filters,
				populate,
				fields,
				pagination,
				publicationState,
				locale,
			},
			{
				encodeValuesOnly: true, // prettify URL
			}
		);
		return query;
	}
}
export default UpdateStrapiService;
