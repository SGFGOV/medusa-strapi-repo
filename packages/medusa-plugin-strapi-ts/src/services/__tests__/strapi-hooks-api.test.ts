import StrapiService from '../update-strapi';
import { jest, describe, expect, beforeEach, it, beforeAll, afterAll } from '@jest/globals';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import {
	regionService,
	productService,
	productTypeService,
	redisClient,
	productVariantService,
	eventBusService,
	disableMocks,
	productCollectionService,
	mockServer,
	enableMocks,
	strapiPath,
	strapiHost,
	productCategoryService,
	isMockEnabled,
} from '../__mocks__/service-mocks';
import { StrapiMedusaPluginOptions } from '../../types/globals';
import { IdMap, MockManager, MockRepository } from 'medusa-test-utils';
import { StrapiResult } from '../update-strapi';
import logger from '../__mocks__/logger';
import { Application } from 'express';
import strapiRoutes from '../../api';
import { StrapiSignalInterface } from '../../api/controllers/hooks/strapi-signal';
import { asFunction, createContainer } from 'awilix';
import axios from 'axios';
import UpdateMedusaService from '../update-medusa';

// This sets the mock adapter on the default instance

let service: StrapiService;
let medusaService: UpdateMedusaService;
let result: StrapiResult;
const timeOut = 600e3;
jest.setTimeout(timeOut);
describe('StrapiService Tests', () => {
	let app: Application;
	jest.setTimeout(timeOut);
	const strapiConfigParameters: StrapiMedusaPluginOptions = {
		encryption_algorithm: 'aes-256-cbc',
		strapi_protocol: 'http',
		strapi_default_user: {
			username: 'testuser15',
			password: 'testuser',
			email: 'test15@test.com',
			firstname: 'test',
			confirmed: true,
			blocked: false,
			provider: 'local',
		},
		strapi_host: strapiHost,
		strapi_admin: {
			password: 'MedusaStrapi1',
			firstname: 'SuperUser',
			email: 'support@medusa-commerce.com',
		},
		strapi_port: parseInt('1337'),
		strapi_secret: 'test',
		strapi_public_key: undefined,
		strapi_ignore_threshold: 0,
		auto_start: true,
	};

	service = new StrapiService(
		{
			manager: MockManager,
			regionService: regionService as any,
			productService: productService as any,
			redisClient,
			productVariantService: productVariantService as any,
			productTypeService: productTypeService as any,
			eventBusService: eventBusService as any,
			productCollectionService: productCollectionService as any,
			productCategoryService: productCategoryService as any,
			logger: logger as any,
		},
		strapiConfigParameters
	);

	medusaService = new UpdateMedusaService({
		manager: MockManager,
		regionService: regionService as any,
		productService: productService as any,
		redisClient,
		productVariantService: productVariantService as any,
		logger: logger as any,
	});

	const entry = {
		unpublish: jest.fn(async () => {
			return {
				id: 'id',
			};
		}),
		archive: jest.fn(async () => {
			return {
				id: 'id',
			};
		}),
	};
	const defaultAuthInterface = service.defaultAuthInterface;
	beforeEach(() => {
		disableMocks();
		jest.clearAllMocks();
	});

	const configureStrapiServer = async () => {
		const registerUser = await service.registerOrLoginDefaultMedusaUser();
		let result: StrapiResult | undefined = undefined;
		const typeResult = await service.createProductTypeInStrapi('dummy', defaultAuthInterface);
		if (typeResult) {
			result = await service.createProductInStrapi(IdMap.getId('exists'), defaultAuthInterface);
			result = await service.createProductInStrapi(IdMap.getId('exists-2'), defaultAuthInterface);
			if (result) {
				result = await service.createProductMetafieldInStrapi(
					{ id: IdMap.getId('exists'), data: { testData: 'test' } } as any,
					defaultAuthInterface
				);
				if (result) {
					result = await service.createProductVariantInStrapi(IdMap.getId('exists'), defaultAuthInterface);
				}
			}
		}
		return result;
	};

	/*describe('health check', () => {
		it('check health', async () => {
			expect(service).toBeDefined();
			expect(service.checkStrapiHealth()).toBeTruthy();
		});
	});*/
	beforeAll(async () => {
		try {
			await axios.head(`${strapiPath}/_health`);
			disableMocks();
		} catch (error) {
			console.warn('you need a working strapi entity to try all the tests');
			enableMocks(axios);
		}
		if (isMockEnabled()) {
			service.selfTestMode = true;
		}
		const serverConfigResult = await configureStrapiServer();
		if (serverConfigResult) {
			app = mockServer();
			const container = createContainer();
			container.register('manager', asFunction(() => MockManager).singleton());
			container.register('updateStrapiService', asFunction(() => service).singleton());
			container.register('updateMedusaService', asFunction(() => medusaService).singleton());

			container.register('eventBusService', asFunction(() => eventBusService).singleton());
			container.register('logger', asFunction(() => logger).singleton());
			container.register(
				'configModule',
				asFunction(() => {
					return {
						projectConfig: {
							jwt_secret: 'test_secret',
						},
					};
				}).singleton()
			);

			container.register('productService', asFunction(() => service.productService_).singleton());
			container.register('productVariantService', asFunction(() => service.productVariantService_).singleton());

			container.register('regionService', asFunction(() => service.regionService_).singleton());
			container.register('paymentProviderService', asFunction(() => jest.fn()).singleton());

			container.register('fulfillmentProviderService', asFunction(() => jest.fn()).singleton());

			container.register('shippingProfileService', asFunction(() => jest.fn()).singleton());
			container.register('shippingOptionService', asFunction(() => jest.fn()).singleton());

			container.register(
				'regionRepository',
				asFunction(() =>
					jest.fn().mockReturnValue(Promise.resolve(MockRepository('regionRepository')))
				).singleton()
			);
			container.register(
				'shippingProfileRepository',
				asFunction(() =>
					jest.fn().mockReturnValue(Promise.resolve(MockRepository('shippingProfileRepository')))
				).singleton()
			);
			container.register(
				'shippingOptionRepository',
				asFunction(() =>
					jest.fn().mockReturnValue(Promise.resolve(MockRepository('shippingOptionRepository')))
				).singleton()
			);
			container.register(
				'productCollectionRepository',
				asFunction(() =>
					jest.fn().mockReturnValue(Promise.resolve(MockRepository('productCollectionRepository')))
				).singleton()
			);
			container.register(
				'storeService',
				asFunction(() => jest.fn().mockReturnValue(Promise.resolve())).singleton()
			);
			container.register(
				'productCollectionService',
				asFunction(() =>
					jest.fn().mockReturnValue(Promise.resolve(service.productCollectionService))
				).singleton()
			);

			app.use((req, _res, next) => {
				req['scope'] = container.createScope() as any;
				next();
			});
			app.use(
				'/',
				strapiRoutes(app, strapiConfigParameters, {
					projectConfig: {
						store_cors: '*',
						jwt_secret: 'test_secret',
						admin_cors: '*',
					},
				} as any)
			);
		}
	});

	afterAll(async () => {
		const defaultAuthInterface = service.defaultAuthInterface;
		if (!isMockEnabled()) {
			result = await service.deleteProductVariantInStrapi(
				{
					id: IdMap.getId('exists'),
				},
				defaultAuthInterface
			);

			result = await service.deleteProductInStrapi({ id: IdMap.getId('exists') }, defaultAuthInterface);

			result = await service.deleteProductInStrapi({ id: IdMap.getId('exists-2') }, defaultAuthInterface);
			result = await service.deleteProductTypeInStrapi({ id: 'dummy' }, defaultAuthInterface);
			result = await service.deleteCollectionInStrapi({ id: IdMap.getId('exists') }, defaultAuthInterface);
			await service.deleteDefaultMedusaUser();
		}
	});
	it(
		'Sanity Check Api',
		async () => {
			const result = await supertest(app).get('/').set('Accept', 'application/json');
			expect(result.status).toBe(404);

			// expect(result?.body).toBeDefined();
			// expect(result?.body.error).toBeUndefined();
			// Check the response type and length
			// Check the response data
		},
		timeOut
	);

	it('POST  hooks update medusa', async () => {
		const strapiSignal = {
			message: 'UPDATE MEDUSA',
			code: 200,
			data: {
				type: 'product',
				data: {
					id: 'exists-3',
					title: 'new-test-title',
				},
			},
		};
		const encoded = jwt.sign(strapiSignal, 'test_secret');
		const result = await supertest(app)
			.post('/strapi/hooks/strapi-signal')
			.send({ signedMessage: encoded })
			.set('Accept', 'application/json');

		expect(result.status).toBe(200);
		expect(result?.body).toBeDefined();
		expect(result?.body.error).toBeUndefined();
		// Check the response type and length
	});
	/**
	 * thi is work in progress
    
	/*
	it("GET  any /content", async () => {
		const result = await supertest(app)
			.get(`/strapi/content/products/${IdMap.getId("exists")}`)
			.set("Accept", "application/json");
		expect(result.status).toBe(200);

		expect(result?.body).toBeDefined();
		expect(result?.body.error).toBeUndefined();
		// Check the response type and length
		// Check the response data
	}); */
});
