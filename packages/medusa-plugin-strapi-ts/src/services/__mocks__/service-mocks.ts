/* eslint-disable @typescript-eslint/no-explicit-any */
import MockAdapter from 'axios-mock-adapter';
import { jest } from '@jest/globals';
import express, { Application } from 'express';

import { IdMap } from 'medusa-test-utils';
export const strapiProtocol = process.env.STRAPI_PROTOCOL ?? 'http';
export const strapiPort = parseInt(process.env.STRAPI_PORT ?? '1337');
export const strapiHost = process.env.STRAPI_HOST ?? 'localhost';
export const strapiPath = `${strapiProtocol}://${strapiHost}:${strapiPort}`;
export const testUserEmail = 'test15@test.com';

export const regionService = {
	count: jest.fn().mockImplementation(() => Promise.resolve(1)),
	list: jest.fn().mockReturnValue(Promise.resolve()),
	retrieve: jest
		.fn()
		.mockImplementationOnce((id) => {
			if (id === IdMap.getId('exists')) {
				return Promise.resolve({
					id: IdMap.getId('exists'),
					name: 'Test Region',
					// countries: [filters:{ id: IdMap.getId('exists') }],
					tax_rate: 0.25,
					// payment_providers: ["default_provider", "unregistered"],
					// fulfillment_providers: ["test_shipper"],
					currency_code: 'inr',
				});
			}
			return Promise.resolve(undefined);
		})
		.mockImplementation((id) => {
			if (id === IdMap.getId('exists')) {
				return Promise.resolve({
					id: IdMap.getId('exists'),
					name: 'new-name',
					// countries: [filters:{ id: IdMap.getId('exists') }],
					tax_rate: 0.25,
					// payment_providers: ["default_provider", "unregistered"],
					// fulfillment_providers: ["test_shipper"],
					currency_code: 'inr',
				});
			}
		}),
};

export const storeService = {
	count: jest.fn().mockImplementation(() => Promise.resolve(1)),
	retrieveByStoreId: jest.fn((id) => {
		if (id === IdMap.getId('exists')) {
			return Promise.resolve({ id: IdMap.getId('exists') });
		}
		return Promise.resolve(undefined);
	}),
};

export const productService = {
	list: jest.fn(async () => {
		return await Promise.all([
			Promise.resolve({
				id: IdMap.getId('exists'),
				type: { id: 'dummy' },
				title: 'test-product',
				// variants: [{ id: IdMap.getId('exists') }]
				options: [
					{
						id: IdMap.getId('exists'),
						title: 'Color',
					},
				],
				// collection_id: IdMap.getId('exists'),
				collection: {
					id: IdMap.getId('exists'),
					handle: 'test-collection',
					title: 'test-collection-title',
				},
				categories: [
					{
						id: IdMap.getId('exists'),
						handle: 'test-category',
						name: 'test-categpry-title',
					},
				],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}),
			Promise.resolve({
				id: IdMap.getId('exists-3'),
				type: { id: 'dummy' },
				title: 'test-product',
				// variants: [{ id: IdMap.getId('exists') }]
				options: [
					{
						id: IdMap.getId('exists-3'),
						title: 'Color',
					},
				],
				// collection_id: IdMap.getId('exists'),
				collection: {
					id: IdMap.getId('exists-3'),
					handle: 'test-collection',
					title: 'test-collection-title',
				},
				categories: [
					{
						id: IdMap.getId('exists-3'),
						handle: 'test-category',
						name: 'test-categpry-title',
					},
				],
				variants:[{
					id: IdMap.getId('exists-3'),
					product: {
						id: IdMap.getId('exists-3'),
						title: 'test-product',
					},
					title: 'test-product-variant',
					inventory_quantity: 10,
					allow_backorder: true,
					manage_inventory: true,
					options: [
						{
							created_at: '2023-01-26T11:47:16.096Z',
							deleted_at: null,
							medusa_id: IdMap.getId('exists-3'),
							metadata: null,
							option_id: IdMap.getId('exists-3'),
							updated_at: '2023-01-26T11:47:16.096Z',
							value: '12',
						},
					],
					/* prices: [
						{
							region_id: "exists",
							currency_code: "inr",
							amount: 950
						}
					]*/
				}],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}),
		]);
	}),
	count: jest.fn().mockImplementation(() => Promise.resolve(1)),
	retrieve: jest
		.fn()
		.mockImplementationOnce((id) => {
			if (id === IdMap.getId('exists') || id == IdMap.getId('exists')) {
				return Promise.resolve({
					id: IdMap.getId('exists'),
					type: { id: 'dummy' },
					title: 'test-product',
					// variants: [{ id: IdMap.getId('exists') }]
					options: [
						{
							id: IdMap.getId('exists'),
							title: 'Color',
						},
					],
					// collection_id: IdMap.getId('exists'),
					collection: {
						id: IdMap.getId('exists'),
						handle: 'test-collection',
						title: 'test-collection-title',
					},
					categories: [
						{
							id: IdMap.getId('exists'),
							handle: 'test-category',
							name: 'test-categpry-title',
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				});
			} else if (id === 'exists-2' || id == IdMap.getId('exists-2')) {
				return Promise.resolve({
					id: IdMap.getId('exists-2'),
					type: { id: 'dummy' },
					title: 'test-product',
					// variants: [{ id: IdMap.getId('exists') }]
					options: [
						{
							id: IdMap.getId('exists'),
							title: 'Color',
						},
					],
					// collection_id: IdMap.getId('exists'),
					collection: {
						id: IdMap.getId('exists'),
						handle: 'test-collection',
						title: 'test-collection-title',
					},
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				});
			}
			
			return Promise.resolve(undefined);
		})
		.mockImplementation((id) => {
			if (id === IdMap.getId('exists') || id == IdMap.getId('exists')) {
				return Promise.resolve({
					id: IdMap.getId('exists'),
					type: { id: 'dummy' },
					title: 'test-product-2',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					collection: {
						id: IdMap.getId('exists'),
						title: 'test',
					},
				});
			} else if (id === 'exists-2' || id == IdMap.getId('exists-2')) {
				return Promise.resolve({
					id: IdMap.getId('exists-2'),
					type: { id: 'dummy' },
					title: 'test-product',
					// variants: [{ id: IdMap.getId('exists') }]
					options: [
						{
							id: IdMap.getId('exists'),
							title: 'Color',
						},
					],
					// collection_id: "exists",
					collection: {
						id: IdMap.getId('exists'),
						handle: 'test-collection',
						title: 'test-collection-title',
					},
					categories: [
						{
							id: IdMap.getId('exists'),
							handle: 'test-category',
							name: 'test-categpry-title',
						},
					],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				});
			}
			else if(id == 'exists-3' || id == IdMap.getId("exists-3")) {
				return {
					id: IdMap.getId('exists-3'),
					type: { id: 'dummy' },
					title: 'test-product',
					// variants: [{ id: IdMap.getId('exists') }]
					options: [
						{
							id: IdMap.getId('exists-3'),
							title: 'Color',
						},
					],
					// collection_id: IdMap.getId('exists'),
					collection: {
						id: IdMap.getId('exists-3'),
						handle: 'test-collection',
						title: 'test-collection-title',
					},
					categories: [
						{
							id: IdMap.getId('exists-3'),
							handle: 'test-category',
							name: 'test-categpry-title',
						},
					],
					variants:[{
						id: IdMap.getId('exists-3'),
						product: {
							id: IdMap.getId('exists-3'),
							title: 'test-product',
						},
						title: 'test-product-variant',
						inventory_quantity: 10,
						allow_backorder: true,
						manage_inventory: true,
						options: [
							{
								created_at: '2023-01-26T11:47:16.096Z',
								deleted_at: null,
								medusa_id: IdMap.getId('exists-3'),
								metadata: null,
								option_id: IdMap.getId('exists-3'),
								updated_at: '2023-01-26T11:47:16.096Z',
								value: '12',
							},
						],
						/* prices: [
							{
								region_id: "exists",
								currency_code: "inr",
								amount: 950
							}
						]*/
					}],
				}
			}
			else if(id == 'exists-4' || id == IdMap.getId("exists-4")) {
				return {
					id: IdMap.getId('exists-4'),
					type: { id: 'dummy' },
					title: 'test-product',
					// variants: [{ id: IdMap.getId('exists') }]
					options: [
						{
							id: IdMap.getId('exists-4'),
							title: 'Color',
						},
					],
					// collection_id: IdMap.getId('exists'),
					collection: {
						id: IdMap.getId('exists-4'),
						handle: 'test-collection',
						title: 'test-collection-title',
					},
					categories: [
						{
							id: IdMap.getId('exists-4'),
							handle: 'test-category',
							name: 'test-categpry-title',
						},
					],
					variants:[{
						id: IdMap.getId('exists-4'),
						product: {
							id: IdMap.getId('exists-4'),
							title: 'test-product',
						},
						title: 'test-product-variant',
						inventory_quantity: 10,
						allow_backorder: true,
						manage_inventory: true,
						options: [
							{
								created_at: '2023-01-26T11:47:16.096Z',
								deleted_at: null,
								medusa_id: IdMap.getId('exists-4'),
								metadata: null,
								option_id: IdMap.getId('exists-4'),
								updated_at: '2023-01-26T11:47:16.096Z',
								value: '12',
							},
						],
						/* prices: [
							{
								region_id: "exists",
								currency_code: "inr",
								amount: 950
							}
						]*/
					}],
				}
			}
			return Promise.resolve(undefined);
		}),
};

export const productTypeService = {
	retrieve: jest.fn((id) => {
		return Promise.resolve({
			value: 'dummy',
			id: 'dummy',
		});
	}),
};

export const productCollectionService = {
	list: jest.fn().mockReturnValue(Promise.resolve()),
	retrieve: jest.fn((id) => {
		return Promise.resolve({
			title: 'test-collection-title',
			handle: 'test-collection',
			id: IdMap.getId('exists'),
		});
	}),
};

export const productCategoryService = {
	list: jest.fn().mockReturnValue(Promise.resolve()),
	retrieve: jest.fn((id) => {
		return Promise.resolve({
			name: 'test-category-title',
			handle: 'test-category',
			id: IdMap.getId('exists'),
		});
	}),
};

export const redisClient = {
	get: async (id): Promise<any> => {
		// const key = `${id}_ignore_${side}`
		if (id === 'ignored_ignore_strapi') {
			return Promise.resolve({ id });
		}
		return undefined;
	},
	set: async (id): Promise<any> => {
		return Promise.resolve(id);
	},
};
export const productVariantService = {
	list: jest.fn().mockReturnValue(Promise.resolve()),
	retrieve: jest
		.fn()
		.mockImplementationOnce((id) => {
			if (id === IdMap.getId('exists') || id == IdMap.getId('exists')) {
				return Promise.resolve({
					id: IdMap.getId('exists'),
					product: {
						id: IdMap.getId('exists'),
						title: 'test-product',
					},
					title: 'test-product-variant',
					inventory_quantity: 10,
					allow_backorder: true,
					manage_inventory: true,
					options: [
						{
							created_at: '2023-01-26T11:47:16.096Z',
							deleted_at: null,
							medusa_id: IdMap.getId('exists'),
							metadata: null,
							option_id: IdMap.getId('exists'),
							updated_at: '2023-01-26T11:47:16.096Z',
							value: '12',
						},
					],
					/* prices: [
						{
							region_id: "exists",
							currency_code: "inr",
							amount: 950
						}
					]*/
				});
			}
			return Promise.resolve(undefined);
		})
		.mockImplementation((id) => {
			if (id === IdMap.getId('exists')) {
				return Promise.resolve({
					id: IdMap.getId('exists'),
					product: {
						id: IdMap.getId('exists'),
						title: 'test-product',
					},
					title: 'test-product-variant-2',
					inventory_quantity: 20,
					options: [
						{
							created_at: '2023-01-26T11:47:16.096Z',
							deleted_at: null,
							medusa_id: IdMap.getId('exists'),
							metadata: null,
							option_id: IdMap.getId('exists'),
							updated_at: '2023-01-26T11:47:16.096Z',
							value: '12',
							variant_id: IdMap.getId('exists'),
						},
					],
				});
			}
			return Promise.resolve(undefined);
		}),
};

export const options = {
	validOption: {
		_id: IdMap.getId('validId'),
		name: 'Default Option',
		region_id: IdMap.getId('fr-region'),
		provider_id: 'default_provider',
		data: {
			id: 'bonjour',
		},
		requirements: [
			{
				_id: 'requirement_id',
				type: 'min_subtotal',
				value: 100,
			},
		],
		price: {
			type: 'flat_rate',
			amount: 10,
		},
	},
	noCalc: {
		_id: IdMap.getId('noCalc'),
		name: 'No Calc',
		region_id: IdMap.getId('fr-region'),
		provider_id: 'default_provider',
		data: {
			id: 'bobo',
		},
		requirements: [
			{
				_id: 'requirement_id',
				type: 'min_subtotal',
				value: 100,
			},
		],
		price: {
			type: 'flat_rate',
			amount: 10,
		},
	},
};

export const ShippingOptionModelMock = {
	create: jest.fn().mockReturnValue(Promise.resolve()),
	updateOne: jest.fn().mockImplementation((query, update) => {
		return Promise.resolve();
	}),
	deleteOne: jest.fn().mockReturnValue(Promise.resolve()),
	findOne: jest.fn().mockImplementation((query: any) => {
		if (query._id === IdMap.getId('noCalc')) {
			return Promise.resolve(options.noCalc);
		}
		if (query._id === IdMap.getId('validId')) {
			return Promise.resolve(options.validOption);
		}
		return Promise.resolve(undefined);
	}),
};

export const profiles = {
	validProfile: {
		_id: IdMap.getId('validId'),
		name: 'Default Profile',
		products: [IdMap.getId('validId')],
		shipping_options: [IdMap.getId('validId')],
	},
	profile1: {
		_id: IdMap.getId('profile1'),
		name: 'Profile One',
		products: [IdMap.getId('product1')],
		shipping_options: [IdMap.getId('shipping_1')],
	},
	profile2: {
		_id: IdMap.getId('profile2'),
		name: 'Profile two',
		products: [IdMap.getId('product2')],
		shipping_options: [IdMap.getId('shipping_2')],
	},
};

export const ShippingProfileModelMock = {
	create: jest.fn().mockReturnValue(Promise.resolve()),
	updateOne: jest.fn().mockImplementation((query, update) => {
		return Promise.resolve();
	}),
	find: jest.fn().mockImplementation((query: any) => {
		if (query.products && query.products.$in) {
			return Promise.resolve([profiles.profile1, profiles.profile2]);
		}

		return Promise.resolve([]);
	}),
	deleteOne: jest.fn().mockReturnValue(Promise.resolve()),
	findOne: jest.fn().mockImplementation((query: any) => {
		if (query.shipping_options === IdMap.getId('validId')) {
			return Promise.resolve(profiles.validProfile);
		}
		if (query.products === IdMap.getId('validId')) {
			return Promise.resolve(profiles.validProfile);
		}
		if (query._id === IdMap.getId('validId')) {
			return Promise.resolve(profiles.validProfile);
		}
		if (query._id === IdMap.getId('profile1')) {
			return Promise.resolve(profiles.profile1);
		}
		return Promise.resolve(undefined);
	}),
};

export const eventBusService = {
	emit: jest.fn().mockReturnValue(Promise.resolve()),
};
export const logger = {
	info: jest.fn((message: any, optionalParams?: any[]) => {
		console.info(message);
	}),
	debug: jest.fn((message: any, optionalParams?: any[]) => {
		console.info(message);
	}),
	error: jest.fn((message: any, optionalParams?: any[]) => {
		console.error(message);
	}),
	warn: jest.fn((message: any, optionalParams?: any[]) => {
		console.warn(message);
	}),
};
export const attachRealInstance = {
	onPut: (): any => {
		return {
			reply: (): void => {
				return;
			},
		};
	},
	onPost: (): any => {
		return {
			reply: (): void => {
				return;
			},
		};
	},
	onGet: (): any => {
		return {
			reply: (): void => {
				return;
			},
		};
	},
	onHead: (): any => {
		return {
			reply: (): void => {
				return;
			},
		};
	},
	onDelete: (): any => {
		return {
			reply: (): void => {
				return;
			},
		};
	},
};

let useMockAxios = true;
let mock: MockAdapter;
export function getMockAdapter(): MockAdapter {
	return mock;
}
export function isMockEnabled() {
	return useMockAxios;
}
export function enableMocks(axios): void {
	useMockAxios = true;
	enableMockFunctions(axios);
}
export function disableMocks(): void {
	useMockAxios = false;
}

function enableCrudMocks(mock: MockAdapter, expressionSingle, expressionPlural, data) {
	mock.onGet(expressionPlural).reply(200, [data]);
	mock.onGet(expressionSingle).reply(200, data);
	mock.onPut(expressionSingle).reply(200, data);

	mock.onPost(expressionPlural).reply(200, [data]);
	mock.onDelete(expressionSingle).reply(200, data);
}

function enableMockFunctions(axios): void {
	const mock = new MockAdapter(axios);
	enableCrudMocks(mock, /api\/products\/.*/gm, /api\/products/gm, {
		medusa_id: IdMap.getId('exists'),
		id: 1,
	});
	enableCrudMocks(mock, /api\/users\/.*/gm, /api\/users/gm, {
		medusa_id: IdMap.getId('exists'),
		id: 1,
	});

	enableCrudMocks(mock, /api\/regions\/.*/gm, /api\/regions/gm, {
		medusa_id: IdMap.getId('exists'),
		id: 1,
	});

	enableCrudMocks(mock, /api\/product[s-](.*[s])\/.*/, /api\/product-.*s$/gm, {
		medusa_id: IdMap.getId('exists'),
		id: 1,
		title: 'test',
	});

	mock.onGet(/\/api\/roles/g).reply(200, {
		data: [
			{
				id: 1,
				name: 'Author',
			},
			{
				id: 1,
				name: 'Editor',
			},
		],
	});
	mock.onGet(/\/api\/countries/g).reply(200, {
		data: [
			{
				id: 1,
				name: 'IN',
			},
			{
				id: 2,
				name: 'US',
			},
		],
	});
	mock.onGet(/\/api\/countries\//g).reply(200, {
		data: [
			{
				id: 1,
				name: 'India',
			},
		],
	});
	mock.onGet(/\/admin\/roles/g).reply(200, {
		data: [
			{
				id: 1,
				name: 'Author',
			},
			{
				id: 2,
				name: 'Editor',
			},
		],
	});
	mock.onGet('/admin/users?filters[email]=testauthor%40test.com&fields[0]=email').reply(200, {
		data: { results: [{ id: 1 }] },
	});

	enableCrudMocks(mock, /\/admin\/users/gm, /\/admin\/users/gm, {
		id: '1',
		name: 'John Smith',
	});
	/*mock.onGet('/admin/users').reply(200, [
		{
			id: '1',
			name: 'John Smith',
		},
	]);
	mock.onGet('/admin/users?').reply(200, {
		id: '1',
		name: 'John Smith',
	});*/
	mock.onPost(/\/admin\/register-admin/gm).reply(400);

	mock.onPost(/\/admin\/login/gm).reply(200, {
		data: {
			token: 'jsgfkjdsgsdgsjdgl2343535235',
			user: {
				id: 1,
				firstname: 'Medusa',
				lastname: 'Commerce',
				username: 'SuperUser',
				email: 'support@medusa-commerce.com',
				isActive: true,
				blocked: false,
				preferedLanguage: null,
				createdAt: '2022-11-06T04:49:07.491Z',
				updatedAt: '2022-11-06T04:49:07.491Z',
			},
		},
	});

	mock.onPost(/.*?\/strapi-plugin-medusajs\/create-medusa-user/gm).reply(200, {
		jwt: 'jsgfkjdsgsdgsjdgl2343535235',
		user: { id: 1, name: 'John Smith', email: testUserEmail },
	});
	mock.onPost(/.*?\/strapi-plugin-medusajs\/synchronise-medusa-tables/gm).reply(200);

	mock.onPost(/\/api\/auth\/local\/register/gm).reply(200, {
		jwt: 'jsgfkjdsgsdgsjdgl2343535235',
		user: { id: 1, name: 'John Smith', email: testUserEmail },
	});
	mock.onPost(/\/api\/auth\/local/gm).reply(200, {
		jwt: 'jsgfkjdsgsdgsjdgl2343535235',
		user: { id: 1, name: 'John Smith', email: testUserEmail },
	});
	const authUrl = '/api/auth/';
	const authRegEx = new RegExp(`${authUrl}/*`);
	mock.onPost(authRegEx).reply(200, {
		jwt: 'jsgfkjdsgsdgsjdgl2343535235',
		profile: { id: 1, name: 'John Smith', email: testUserEmail },
	});

	mock.onPost('/api/medusa/setup').reply(200);
	const apiUrl = '/api';
	const apiRegEx = new RegExp(`${apiUrl}/*`);
	mock.onPost(apiRegEx).reply(200, {
		jwt: 'jsgfkjdsgsdgsjdgl2343535235',
		profile: { id: 1, name: 'John Smith', email: testUserEmail },
	});

	//mock.onHead('/_health').reply(200);
	mock.onHead().reply(200);
}

export function mockServer(): Application {
	const app = express();
	app.use(express.json());

	return app;
}
