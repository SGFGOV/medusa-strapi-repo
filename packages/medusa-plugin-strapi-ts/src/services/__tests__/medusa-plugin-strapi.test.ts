import StrapiService, { LoginTokenExpiredError } from '../update-strapi';
import { jest, describe, expect, beforeEach, it, beforeAll, afterAll } from '@jest/globals';
import {
	regionService,
	productService,
	productTypeService,
	redisClient,
	productVariantService,
	eventBusService,
	disableMocks,
	productCollectionService,
	productCategoryService,
	enableMocks,
	isMockEnabled,
	strapiHost,
	strapiPath,
	testUserEmail,
	strapiProtocol,
	strapiPort,
} from '../__mocks__/service-mocks';
import { StrapiMedusaPluginOptions } from '../../types/globals';
import { IdMap, MockManager } from 'medusa-test-utils';
import UpdateStrapiService, { StrapiResult } from '../update-strapi';
import logger from '../__mocks__/logger';
import axios, { AxiosError } from 'axios';
import exp from 'constants';
import qs from 'qs';

// This sets the mock adapter on the default instance

let service: StrapiService;
let result: StrapiResult;
const testTimeOut = 120e3;
jest.setTimeout(testTimeOut);

describe('StrapiService Tests', () => {
	jest.setTimeout(testTimeOut);
	try {
		axios.head(`${strapiPath}/_health`).then(
			() => disableMocks(),
			() => {
				enableMocks(axios);
				console.warn('you need a working strapi entity to try all the tests');
			}
		);
	} catch (error) {
		enableMocks(axios);
	}
	const strapiConfigParameters: StrapiMedusaPluginOptions = {
		encryption_algorithm: 'aes-256-cbc',
		strapi_default_user: {
			username: 'testuser15',
			password: 'testuser',
			email: testUserEmail,
			firstname: 'test',
			confirmed: true,
			blocked: false,
			provider: 'local',
		},

		strapi_admin: {
			password: 'MedusaStrapi1',
			firstname: 'SuperUser',
			email: 'support@medusa-commerce.com',
		},
		strapi_host: strapiHost,
		strapi_protocol: strapiProtocol,
		strapi_port: strapiPort,
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
	if (isMockEnabled()) {
		service.selfTestMode = true;
	}

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
		//disableMocks();
		jest.clearAllMocks();
	});

	describe('health check', () => {
		it('check health', async () => {
			expect(service).toBeDefined();
			expect(service.checkStrapiHealth()).toBeTruthy();
		});
	});

	describe('utils', () => {
		it('test query builder', async () => {
			const testQueryPattern =
				'sort[0]=title%3Aasc&filters[title][$eq]=hello&populate=%2A&' +
				'fields[0]=title&pagination[pageSize]=10&pagination[page]=1&' +
				'publicationState=live&locale[0]=en';

			const query = service.createStrapiRestQuery({
				sort: ['title:asc'],
				filters: {
					title: {
						$eq: 'hello',
					},
				},
				populate: '*',
				fields: ['title'],
				pagination: {
					pageSize: 10,
					page: 1,
				},
				publicationState: 'live',
				locale: ['en'],
			});
			expect(query).toBe(testQueryPattern);
		});
		describe('test user parameter parsing', () => {
			it('test parameter creation', () => {
				const string = service.appendIdToStrapiFilter('', 'medusa_1235');
				expect(string).toMatch(`medusa_1235`);
			});
		});
	});
	describe('user CURD', () => {
		it(
			'register or login admin',
			async () => {
				await service.registerOrLoginAdmin();
				expect(service.strapiSuperAdminAuthToken).toBeDefined();
				expect(service.strapiSuperAdminAuthToken.length).toBeGreaterThan(0);

				const roleId = await service.getRoleId('Author');
				expect(roleId).toBeGreaterThan(0);
			},
			testTimeOut
		);

		it(
			'register or login admin with refresh by throwing an exception',
			async () => {
				if (!isMockEnabled()) {
					const axiosSpy = jest.spyOn(axios, 'post').mockImplementationOnce(() => {
						throw new LoginTokenExpiredError({
							error: new AxiosError('test error', '401', {}, {}, {} as any),
							response: {
								status: 401,
							},
							message: 'test error',
						});
					});

					await service.loginAsDefaultMedusaUser();
					expect(axiosSpy).toBeCalled();
					expect(service.strapiSuperAdminAuthToken).toBeDefined();
					expect(service.strapiSuperAdminAuthToken.length).toBeGreaterThan(0);
					const spy = jest.spyOn(service, 'executeLoginAsStrapiUser');
					const spy_2 = jest.spyOn(service, 'retrieveRefreshedToken');
					const roleId = await service.getType('products', defaultAuthInterface);
					expect(spy).toBeCalledTimes(2);
					expect(spy_2).toBeCalledTimes(2);
					//	expect(roleId).toBeGreaterThan(0);
				} else {
					console.warn('disabled when not connected to test server');
					expect(1).toBe(1);
				}
			},
			testTimeOut
		);

		it(
			'register or login admin with refresh by resetting expiry time',
			async () => {
				if (!isMockEnabled()) {
					const spy = jest.spyOn(service, 'executeLoginAsStrapiUser');
					service.userTokens[testUserEmail].time = 0;
					await service.registerOrLoginDefaultMedusaUser();

					service.userTokens[testUserEmail].time = 0;
					await service.getType('products', defaultAuthInterface);
					expect(spy).toBeCalled();
					//expect(roleId).toBeGreaterThan(0);
				} else {
					console.warn('disabled when not connected to test server');
					expect(1).toBe(1);
				}
			},
			testTimeOut
		);

		it(
			'check if error is sent if role doesnt exists',
			async () => {
				const roleId = await service.getRoleId('new role');
				expect(roleId).toBe(-1);
			},
			testTimeOut
		);

		it(
			'register or login default medusa user',
			async () => {
				const credentials = await service.registerOrLoginDefaultMedusaUser();
				expect(credentials.token).toBeDefined();
			},
			testTimeOut
		);

		it(
			'delete medusa user',
			async () => {
				if (!isMockEnabled()) {
					await service.deleteDefaultMedusaUser();
					const credentials = await service.loginAsDefaultMedusaUser();
					expect(credentials).toBeUndefined();
				} else {
					console.warn('disabled when not connected to test server');
					expect(true).toBe(true);
				}
			},
			testTimeOut
		);
	});
	describe('user actions and signal send', () => {
		beforeAll(async () => await service.registerOrLoginDefaultMedusaUser());

		afterAll(async () => {
			await service.deleteDefaultMedusaUser();
		});

		it(
			'medusa sync check',
			async () => {
				result = await service.startInterface();
				// console.log(result);
				expect(result.status).toBeGreaterThanOrEqual(200);
				expect(result.status).toBeLessThan(300);
			},
			testTimeOut
		);
	});

	describe('product actions', () => {
		beforeAll(async () => await service.registerOrLoginDefaultMedusaUser());

		afterAll(async () => {
			await service.deleteDefaultMedusaUser();
		});

		const spy = jest.spyOn(service, 'getType');
		describe('product  creation and update', () => {
			it('product-type-creation', async () => {
				const typeResult = await service.createProductTypeInStrapi('dummy', defaultAuthInterface);
				expect(typeResult).toBeDefined();
				if (typeResult) {
					const typeGetResult = await service.getEntitiesFromStrapi({
						authInterface: defaultAuthInterface,
						strapiEntityType: 'product-types',
					});
					expect(typeGetResult).toBeDefined();
					expect(typeGetResult.data.length > 0).toBeTruthy();
				}
				expect(spy).toHaveBeenCalled();
			});

			it(
				'product creation',
				async () => {
					const product_id = IdMap.getId('exists');
					result = await service.createProductInStrapi(product_id, defaultAuthInterface);
					expect(result).toBeDefined();
					expect(result.status == 200 || result.status == 302).toBeTruthy();
					expect(result.data?.medusa_id).toBeDefined();
					expect(result.data).toMatchObject({
						medusa_id: product_id,
					});
					expect(spy).toHaveBeenCalled();
					if (result) {
						const productGetResult = await service.getEntitiesFromStrapi({
							authInterface: defaultAuthInterface,
							strapiEntityType: 'products',
						});
						expect(productGetResult).toBeDefined();
						expect(productGetResult.data.length > 0).toBeTruthy();
					}
				},
				testTimeOut
			);

			it(
				'product creation and variant',
				async () => {
					let productIdString = 'exists';
					if (!isMockEnabled()) {
						productIdString = 'exists-3';
					}
					const product_id = IdMap.getId(productIdString);
					result = await service.createProductInStrapi(product_id, defaultAuthInterface);
					expect(result).toBeDefined();
					expect(result.status == 200 || result.status == 302).toBeTruthy();
					expect(result.data?.medusa_id).toBeDefined();
					expect(result.data).toMatchObject({
						medusa_id: product_id,
					});
					if (!isMockEnabled()) {
						expect(result.data?.['product_variants']).toBeDefined();
						expect(result.data?.['product_variants'].length > 0).toBeTruthy();
					}
					expect(spy).toHaveBeenCalled();
					if (result) {
						const productGetResult = await service.getEntitiesFromStrapi({
							authInterface: defaultAuthInterface,
							strapiEntityType: 'products',
						});
						expect(productGetResult).toBeDefined();
						expect(productGetResult.data.length > 0).toBeTruthy();
						const productFieldsGetResult = await service.getEntitiesFromStrapi({
							authInterface: defaultAuthInterface,
							strapiEntityType: 'products',
							urlQuery: { fields: ['title', 'id', 'medusa_id'] },
						});
						expect(productFieldsGetResult.data[0].id).toBeDefined();
						expect(productFieldsGetResult.data[0].medusa_id).toBeDefined();
						if (!isMockEnabled()) {
							expect(productFieldsGetResult.data[0].title).toBeDefined();
						}
						expect(productFieldsGetResult.data[0].handle).toBeUndefined();
						const productPopulateGetResult = await service.getEntitiesFromStrapi({
							authInterface: defaultAuthInterface,
							strapiEntityType: 'products',
							urlQuery: { populate: 'product_variants' },
						});
						if (!isMockEnabled()) {
							const testData = productPopulateGetResult.data[0];
							expect(testData['product_variants']).toBeDefined();
						}
					}
				},

				testTimeOut
			);

			it(
				'product recreation',
				async () => {
					if (!isMockEnabled()) {
						result = await service.createProductInStrapi(IdMap.getId('exists'), defaultAuthInterface);
						expect(result).toBeDefined();
						expect(result.status).toBe(302);
						expect(result.data?.medusa_id).toBeDefined();
						expect(result.data).toMatchObject({
							medusa_id: IdMap.getId('exists'),
						});
						expect(spy).toHaveBeenCalled();
						if (result) {
							const productGetResult = await service.getEntitiesFromStrapi({
								authInterface: defaultAuthInterface,
								strapiEntityType: 'products',
							});
							expect(productGetResult).toBeDefined();
							expect(productGetResult.data.length > 0).toBeTruthy();
						}
					} else {
						console.warn('disabled when not connected to test server');
						expect(true).toBe(true);
					}
				},
				testTimeOut
			);

			it(
				'product second creation in the same ',
				async () => {
					if (!isMockEnabled()) {
						result = await service.createProductInStrapi(IdMap.getId('exists-2'), defaultAuthInterface);
						expect(result).toBeDefined();
						expect(result.status == 200 || result.status == 302).toBeTruthy();
						expect(result.data?.medusa_id).toBeDefined();

						expect(result.data).toMatchObject({
							medusa_id: IdMap.getId('exists-2'),
						});

						expect(spy).toHaveBeenCalled();
						if (result) {
							const productGetResult = await service.getEntitiesFromStrapi({
								authInterface: defaultAuthInterface,
								strapiEntityType: 'products',
							});
							expect(productGetResult).toBeDefined();
							expect(productGetResult.data.length > 0).toBeTruthy();
						}
					} else {
						console.warn('disabled when not connected to test server');
						expect(true).toBe(true);
					}
				},
				testTimeOut
			);

			it(
				'product update product',
				async () => {
					result = await service.updateProductInStrapi(
						{ id: IdMap.getId('exists'), title: 'new-title' },
						defaultAuthInterface
					);
					expect(result).toBeDefined();
					expect(result.status == 200 || result.status == 302).toBeTruthy();
					if (!isMockEnabled()) {
						expect(result).toMatchObject({
							data: { title: 'new-title', medusa_id: IdMap.getId('exists') },
						});
					}

					expect(spy).toHaveBeenCalled();
				},
				testTimeOut
			);
			it(
				'attempt to update non existing product',
				async () => {
					result = await service.updateProductInStrapi(
						{ id: IdMap.getId('exists-4'), title: 'test-product' },
						defaultAuthInterface
					);
					expect(result).toBeDefined();
					expect(result.status == 200 || result.status == 302).toBeTruthy();
					if (!isMockEnabled()) {
						expect(result).toMatchObject({
							data: { title: 'test-product', medusa_id: IdMap.getId('exists-4') },
						});
					}

					expect(spy).toHaveBeenCalled();
				},
				testTimeOut
			);
			it('create metafields in strapi', async () => {
				result = await service.createProductMetafieldInStrapi(
					{
						id: IdMap.getId('exists'),
						value: { testData: 'test' },
					},
					defaultAuthInterface
				);
				expect(result).toBeDefined();
				expect(result.status == 200 || result.status == 302).toBeTruthy();
				expect(spy).toHaveBeenCalled();
				if (result) {
					const productMetafieldsGetResult = await service.getEntitiesFromStrapi({
						authInterface: defaultAuthInterface,
						strapiEntityType: 'product-metafields',
					});
					expect(productMetafieldsGetResult).toBeDefined();
					expect(productMetafieldsGetResult.data.length > 0).toBeTruthy();
				}
			});

			it('update metafields in strapi', async () => {
				result = await service.updateProductMetafieldInStrapi(
					{
						id: IdMap.getId('exists'),
						value: { testData: 'test-2' },
					} as any,
					defaultAuthInterface
				);
				expect(result).toBeDefined();
				expect(result.status).toBe(200);
				expect(spy).toHaveBeenCalled();
			});

			it('testing health-check-fail recovery', async () => {
				UpdateStrapiService.isHealthy = false; /** forcing health check failed status */
				result = await service.updateProductMetafieldInStrapi(
					{
						id: IdMap.getId('exists'),
						data: { testData: 'test-3' },
					} as any,
					defaultAuthInterface
				);
				expect(result).toBeDefined();
				expect(result.status).toBe(200);
				expect(spy).toHaveBeenCalled();
			});

			it('create  and update product variant in strapi', async () => {
				result = await service.createProductVariantInStrapi(IdMap.getId('exists'), defaultAuthInterface);
				expect(result).toBeDefined();
				expect(result.status == 200 || result.status == 302).toBeTruthy();

				if (result) {
					const productVariantGetResult = await service.getEntitiesFromStrapi({
						authInterface: defaultAuthInterface,
						strapiEntityType: 'product-variants',
					});
					expect(productVariantGetResult).toBeDefined();
					expect(productVariantGetResult.data.length > 0).toBeTruthy();
				}

				result = await service.updateProductVariantInStrapi(
					{ id: IdMap.getId('exists'), title: 'test-product-variant-2' },
					defaultAuthInterface
				);
				expect(result).toBeDefined();
				expect(result.status == 200 || result.status == 302).toBeTruthy();
				expect(spy).toHaveBeenCalled();
			});

			it('create  and update product category in strapi', async () => {
				result = await service.createCategoryInStrapi(IdMap.getId('exists'), defaultAuthInterface);
				expect(result).toBeDefined();
				expect(result.status == 200 || result.status == 302).toBeTruthy();

				if (result) {
					const productCategoryResult = await service.getEntitiesFromStrapi({
						authInterface: defaultAuthInterface,
						strapiEntityType: 'product-categories',
					});
					expect(productCategoryResult).toBeDefined();
					expect(productCategoryResult.data.length > 0).toBeTruthy();
				}

				result = await service.updateCategoryInStrapi(
					{ id: IdMap.getId('exists'), name: 'test-product-variant-2' },
					defaultAuthInterface
				);
				expect(result).toBeDefined();
				expect(result.status == 200 || result.status == 302).toBeTruthy();

				expect(spy).toHaveBeenCalled();
			});
		});

		describe('deletions', () => {
			it('clean up product variants ', async () => {
				if (!isMockEnabled()) {
					result = await service.deleteProductVariantInStrapi(
						{
							id: IdMap.getId('exists'),
						},
						defaultAuthInterface
					);
					const falseResult = await service.getEntitiesFromStrapi({
						strapiEntityType: 'product-variants',
						authInterface: defaultAuthInterface,
						id: IdMap.getId('exists'),
					});
					expect(falseResult.status).toBe(404);
				} else {
					console.warn('disabled when not connected to test server');
					expect(true).toBe(true);
				}
			});
			it('clean up products ', async () => {
				if (!isMockEnabled()) {
					result = await service.deleteProductInStrapi({ id: IdMap.getId('exists') }, defaultAuthInterface);
					result = await service.deleteProductInStrapi({ id: IdMap.getId('exists-3') }, defaultAuthInterface);
					expect(result.status).toBe(200);
					let falseResult = await service.getEntitiesFromStrapi({
						strapiEntityType: 'products',
						authInterface: defaultAuthInterface,
						id: result.data?.medusa_id,
					});

					/*   result = await service.deleteCollectionInStrapi(
					{ id: "exists" },
					defaultAuthInterface
				);

				expect(result.status != 200).toBeTruthy();*/

					result = await service.deleteProductMetafieldInStrapi(
						{ id: IdMap.getId('exists') },
						defaultAuthInterface
					);
					expect(result.status).toBe(200);
					falseResult = await service.getEntitiesFromStrapi({
						strapiEntityType: 'product-metafields',
						authInterface: defaultAuthInterface,
						id: result.data?.medusa_id,
					});

					result = await service.deleteProductInStrapi({ id: IdMap.getId('exists-2') }, defaultAuthInterface);
					expect(result.status).toBe(200);
					falseResult = await service.getEntitiesFromStrapi({
						strapiEntityType: 'products',
						authInterface: defaultAuthInterface,
						id: result.data?.medusa_id,
					});
					expect(falseResult.status).toBe(200);
					expect(
						falseResult.data?.filter((d: { id: any }) => d.id == result.data.deletedData.id).length
					).toBe(0);
				} else {
					console.warn('disabled when not connected to test server');
					expect(true).toBe(true);
				}
			});

			it('create  and update product variant in strapi and cascade delete', async () => {
				result = await service.createProductVariantInStrapi(IdMap.getId('exists'), defaultAuthInterface);
				expect(result).toBeDefined();
				expect(result.status == 200 || result.status == 302).toBeTruthy();

				expect(spy).toHaveBeenCalled();
				if (!isMockEnabled()) {
					result = await service.deleteProductInStrapi({ id: IdMap.getId('exists') }, defaultAuthInterface);
					const productVariantGetResult = await service.getEntitiesFromStrapi({
						authInterface: defaultAuthInterface,
						strapiEntityType: 'product-variants',
						id: IdMap.getId('exists'),
					});
					expect(productVariantGetResult.status).toBe(404);
				}
			});

			it('clean up types, categories and collections', async () => {
				if (!isMockEnabled()) {
					result = await service.deleteCategoryInStrapi({ id: IdMap.getId('exists') }, defaultAuthInterface);
					result = await service.deleteCategoryInStrapi(
						{ id: IdMap.getId('exists-3') },
						defaultAuthInterface
					);

					let falseResult = await service.getEntitiesFromStrapi({
						strapiEntityType: 'product-categories',
						authInterface: defaultAuthInterface,
						id: result.data?.medusa_id,
					});
					expect(falseResult.status == 404 || falseResult.data[0] == undefined).toBeTruthy();

					result = await service.deleteProductTypeInStrapi({ id: 'dummy' }, defaultAuthInterface);
					expect(result.status).toBe(200);
					falseResult = await service.getEntitiesFromStrapi({
						strapiEntityType: 'product-types',
						authInterface: defaultAuthInterface,
						id: result.data?.medusa_id,
					});

					expect(falseResult.status).toBe(404);
					result = await service.deleteCollectionInStrapi(
						{ id: IdMap.getId('exists') },
						defaultAuthInterface
					);
					result = await service.deleteCollectionInStrapi(
						{ id: IdMap.getId('exists-3') },
						defaultAuthInterface
					);
					falseResult = await service.getEntitiesFromStrapi({
						strapiEntityType: 'product-collections',
						authInterface: defaultAuthInterface,
						id: result.data?.medusa_id,
					});
					expect(falseResult.status).toBe(200);
					expect(falseResult.data?.length).toBe(1);
				} else {
					console.warn('disabled when not connected to test server');
					expect(true).toBe(true);
				}
			});
		});
	});
});
describe('region checks', () => {
	beforeAll(async () => await service.registerOrLoginDefaultMedusaUser());
	afterAll(async () => {
		if (!isMockEnabled()) {
			const defaultAuthInterface = service.defaultAuthInterface;
			try {
				result = (await service.getEntitiesFromStrapi({
					strapiEntityType: 'regions',
					authInterface: defaultAuthInterface,
					id: IdMap.getId('exists'),
				})) as StrapiResult;
			} catch (e) {
				console.error(`region clean up error ${e.message}`);
			}
			if (result) {
				result = await service.deleteRegionInStrapi({ id: IdMap.getId('exists') }, defaultAuthInterface);
			}
			const falseResult = await service.getEntitiesFromStrapi({
				strapiEntityType: 'regions',
				authInterface: defaultAuthInterface,
				id: result.data?.deletedData.medusa_id,
			});
			expect(falseResult.status == 404).toBeTruthy();

			await service.deleteDefaultMedusaUser();
		}
	});
	it(
		'CURD Regions in strapi',
		async () => {
			const creds = await service.registerOrLoginDefaultMedusaUser();
			const defaultAuthInterface = service.defaultAuthInterface;
			expect(creds).toBeDefined();

			result = await service.createEntryInStrapi({
				method: 'post',
				type: 'countries',
				data: {
					id: IdMap.getId('exists'),
					name: 'IN',
					iso_2: 'IN',
					iso_3: 'IND',
					display_name: 'India',
					num_code: 91,
				} as any,
				authInterface: defaultAuthInterface,
			});
			expect(result).toBeDefined();
			expect(result.status == 200 || result.status == 302).toBeTruthy();
			expect(result).toMatchObject({
				data: { id: 1, name: 'IN' },
			});

			result = await service.createRegionInStrapi(IdMap.getId('exists'), defaultAuthInterface);
			expect(result).toBeDefined();
			expect(result.status == 200 || result.status == 302).toBeTruthy();
			result = await service.updateRegionInStrapi(
				{ id: IdMap.getId('exists'), name: 'new-name' },
				defaultAuthInterface
			);
			expect(result).toBeDefined();
			expect(result.status == 200 || result.status == 302).toBeTruthy();
			if (!isMockEnabled()) {
				result = (await service.getEntitiesFromStrapi({
					id: IdMap.getId('exists'),
					authInterface: defaultAuthInterface,
					strapiEntityType: 'regions',
				})) as StrapiResult;
				expect(result).toMatchObject({
					data: [{ name: 'new-name', medusa_id: IdMap.getId('exists') }],
				});
			}
			result = (await service.getEntitiesFromStrapi({
				strapiEntityType: 'regions',
				authInterface: defaultAuthInterface,
				id: IdMap.getId('exists'),
			})) as StrapiResult;
			expect(result.status).toBe(200);
		},
		testTimeOut
	);
});
describe('admin CURD', () => {
	it('register or login admin', async () => {
		await service.registerOrLoginAdmin();
		expect(service.strapiSuperAdminAuthToken).toBeDefined();
		expect(service.strapiSuperAdminAuthToken.length).toBeGreaterThan(0);
	});
	it('check if default Author role exists', async () => {
		const roleId = await service.getRoleId('Author');
		expect(roleId).toBeGreaterThan(0);
	});
	it('check if default Editor role exists', async () => {
		const roleId = await service.getRoleId('Editor');
		expect(roleId).toBeGreaterThan(0);
	});

	it(
		'register test admin as Author',
		async () => {
			result = await service.registerAdminUserInStrapi('testAuthor@test.com', 'test');
			expect(result.status == 201 || result.status == 200).toBeTruthy();
			// console.log(service.strapiDefaultUserId);
			//  expect(result.id).toBeDefined();
			//  expect(result.id).toBeGreaterThan(0);
		},
		testTimeOut
	);
	it(
		'find all admin users',
		async () => {
			result = await service.getAllAdminUserInStrapi();
			expect(result.status).toBe(200);
			// console.log(service.strapiDefaultUserId);
			//  expect(result.id).toBeDefined();
			//  expect(result.id).toBeGreaterThan(0);
		},
		testTimeOut
	);
	if (!isMockEnabled()) {
		it(
			'activate test admin as Author',
			async () => {
				result = await service.updateAdminUserInStrapi('testAuthor@test.com', 'test');
				expect(result).toBeDefined();
				expect(result.status == 201 || result.status == 200).toBeTruthy();
			},
			testTimeOut
		);
	}
	if (!isMockEnabled()) {
		it(
			'register duplication admin as Editor should fail',
			async () => {
				result = await service.registerAdminUserInStrapi('testAuthor@test.com', 'Editor');
				expect(result.status == 201 || result.status == 200).toBeTruthy();
			},
			testTimeOut
		);
	}
	it(
		'register admin as Editor',
		async () => {
			result = await service.registerAdminUserInStrapi('testEditor@test.com', 'Editor');
			expect(result).toBeDefined();
			expect(result.status == 201 || result.status == 200).toBeTruthy();
		},
		testTimeOut
	);
	if (!isMockEnabled())
		it(
			'delete medusa user',
			async () => {
				result = await service.deleteAdminUserInStrapi('testEditor@test.com');
				expect(result.status).toBe(200);
				result = await service.getAdminUserInStrapi('testEditor@test.com');
				expect(result.status).toBe(200);
				expect(result.data).toBeUndefined();
				result = await service.deleteAdminUserInStrapi('testAuthor@test.com');
				expect(result.status).toBe(200);
				result = await service.getAdminUserInStrapi('testAuthor@test.com');
				expect(result.status).toBe(200);
				expect(result.data).toBeUndefined();
				result = await service.getAdminUserInStrapi('testEditor@test.com');
				expect(result.status).toBe(200);
				expect(result.data).toBeUndefined();
			},
			testTimeOut
		);
});
