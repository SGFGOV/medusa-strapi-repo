/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { jest } from "@jest/globals";
import express, { Application } from "express";
import routes from "../../api/index";

import { IdMap } from "medusa-test-utils";
import { exists } from "fs";

export const regionService = {
    count: jest.fn().mockImplementation(() => Promise.resolve(1)),
    list: jest.fn().mockReturnValue(Promise.resolve()),
    retrieve: jest
        .fn()
        .mockImplementationOnce((id) => {
            if (id === "exists") {
                return Promise.resolve({
                    id: "exists",
                    name: "Test Region",
                    // countries: [filters:{ id: "exists" }],
                    tax_rate: 0.25,
                    // payment_providers: ["default_provider", "unregistered"],
                    // fulfillment_providers: ["test_shipper"],
                    currency_code: "inr"
                });
            }
            return Promise.resolve(undefined);
        })
        .mockImplementation((id) => {
            if (id === "exists") {
                return Promise.resolve({
                    id: "exists",
                    name: "new-name",
                    // countries: [filters:{ id: "exists" }],
                    tax_rate: 0.25,
                    // payment_providers: ["default_provider", "unregistered"],
                    // fulfillment_providers: ["test_shipper"],
                    currency_code: "inr"
                });
            }
        })
};

export const storeService = {
    count: jest.fn().mockImplementation(() => Promise.resolve(1)),
    retrieveByStoreId: jest.fn((id) => {
        if (id === "exists") {
            return Promise.resolve({ id: "exists" });
        }
        return Promise.resolve(undefined);
    })
};

export const productService = {
    list: jest.fn(async () => {
        return await Promise.all([
            Promise.resolve({
                id: IdMap.getId("exists"),
                type: { id: "dummy" },
                title: "test-product",
                // variants: [{ id: "exists" }]
                options: [
                    {
                        id: "exists",
                        title: "Color"
                    }
                ],
                // collection_id: "exists",
                collection: {
                    id: "exists",
                    handle: "test-collection",
                    title: "test-collection-title"
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        ]);
    }),
    count: jest.fn().mockImplementation(() => Promise.resolve(1)),
    retrieve: jest
        .fn()
        .mockImplementationOnce((id) => {
            if (id === "exists" || id == IdMap.getId("exists")) {
                return Promise.resolve({
                    id: IdMap.getId("exists"),
                    type: { id: "dummy" },
                    title: "test-product",
                    // variants: [{ id: "exists" }]
                    options: [
                        {
                            id: "exists",
                            title: "Color"
                        }
                    ],
                    // collection_id: "exists",
                    collection: {
                        id: "exists",
                        handle: "test-collection",
                        title: "test-collection-title"
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            } else if (id === "exists-2" || id == IdMap.getId("exists-2")) {
                return Promise.resolve({
                    id: IdMap.getId("exists-2"),
                    type: { id: "dummy" },
                    title: "test-product",
                    // variants: [{ id: "exists" }]
                    options: [
                        {
                            id: "exists",
                            title: "Color"
                        }
                    ],
                    // collection_id: "exists",
                    collection: {
                        id: "exists",
                        handle: "test-collection",
                        title: "test-collection-title"
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
            return Promise.resolve(undefined);
        })
        .mockImplementation((id) => {
            if (id === "exists" || id == IdMap.getId("exists")) {
                return Promise.resolve({
                    id: IdMap.getId("exists"),
                    type: { id: "dummy" },
                    title: "test-product-2",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    collection: {
                        id: "exists",
                        title: "test"
                    }
                });
            } else if (id === "exists-2" || id == IdMap.getId("exists-2")) {
                return Promise.resolve({
                    id: IdMap.getId("exists-2"),
                    type: { id: "dummy" },
                    title: "test-product",
                    // variants: [{ id: "exists" }]
                    options: [
                        {
                            id: "exists",
                            title: "Color"
                        }
                    ],
                    // collection_id: "exists",
                    collection: {
                        id: "exists",
                        handle: "test-collection",
                        title: "test-collection-title"
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
            return Promise.resolve(undefined);
        })
};

export const productTypeService = {
    retrieve: jest.fn((id) => {
        return Promise.resolve({
            value: "dummy",
            id: "dummy"
        });
    })
};

export const productCollectionService = {
    retrieve: jest.fn((id) => {
        return Promise.resolve({
            title: "test-collection-title",
            handle: "test-collection",
            id: "exists"
        });
    })
};

export const redisClient = {
    get: async (id): Promise<any> => {
        // const key = `${id}_ignore_${side}`
        if (id === "ignored_ignore_strapi") {
            return Promise.resolve({ id });
        }
        return undefined;
    },
    set: async (id): Promise<any> => {
        return Promise.resolve(id);
    }
};
export const productVariantService = {
    retrieve: jest
        .fn()
        .mockImplementationOnce((id) => {
            if (id === "exists" || id == IdMap.getId("exists")) {
                return Promise.resolve({
                    id: "exists",
                    product: {
                        id: IdMap.getId("exists"),
                        title: "test-product"
                    },
                    title: "test-product-variant",
                    inventory_quantity: 10,
                    allow_backorder: true,
                    manage_inventory: true,
                    options: [
                        {
                            created_at: "2023-01-26T11:47:16.096Z",
                            deleted_at: null,
                            medusa_id: "exists",
                            metadata: null,
                            option_id: "exists",
                            updated_at: "2023-01-26T11:47:16.096Z",
                            value: "12"
                        }
                    ]
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
            if (id === "exists") {
                return Promise.resolve({
                    id: "exists",
                    product: {
                        id: IdMap.getId("exists"),
                        title: "test-product"
                    },
                    title: "test-product-variant-2",
                    inventory_quantity: 20,
                    options: [
                        {
                            created_at: "2023-01-26T11:47:16.096Z",
                            deleted_at: null,
                            medusa_id: "exists",
                            metadata: null,
                            option_id: "exists",
                            updated_at: "2023-01-26T11:47:16.096Z",
                            value: "12",
                            variant_id: "exists"
                        }
                    ]
                });
            }
            return Promise.resolve(undefined);
        })
};

export const options = {
    validOption: {
        _id: IdMap.getId("validId"),
        name: "Default Option",
        region_id: IdMap.getId("fr-region"),
        provider_id: "default_provider",
        data: {
            id: "bonjour"
        },
        requirements: [
            {
                _id: "requirement_id",
                type: "min_subtotal",
                value: 100
            }
        ],
        price: {
            type: "flat_rate",
            amount: 10
        }
    },
    noCalc: {
        _id: IdMap.getId("noCalc"),
        name: "No Calc",
        region_id: IdMap.getId("fr-region"),
        provider_id: "default_provider",
        data: {
            id: "bobo"
        },
        requirements: [
            {
                _id: "requirement_id",
                type: "min_subtotal",
                value: 100
            }
        ],
        price: {
            type: "flat_rate",
            amount: 10
        }
    }
};

export const ShippingOptionModelMock = {
    create: jest.fn().mockReturnValue(Promise.resolve()),
    updateOne: jest.fn().mockImplementation((query, update) => {
        return Promise.resolve();
    }),
    deleteOne: jest.fn().mockReturnValue(Promise.resolve()),
    findOne: jest.fn().mockImplementation((query: any) => {
        if (query._id === IdMap.getId("noCalc")) {
            return Promise.resolve(options.noCalc);
        }
        if (query._id === IdMap.getId("validId")) {
            return Promise.resolve(options.validOption);
        }
        return Promise.resolve(undefined);
    })
};

export const profiles = {
    validProfile: {
        _id: IdMap.getId("validId"),
        name: "Default Profile",
        products: [IdMap.getId("validId")],
        shipping_options: [IdMap.getId("validId")]
    },
    profile1: {
        _id: IdMap.getId("profile1"),
        name: "Profile One",
        products: [IdMap.getId("product1")],
        shipping_options: [IdMap.getId("shipping_1")]
    },
    profile2: {
        _id: IdMap.getId("profile2"),
        name: "Profile two",
        products: [IdMap.getId("product2")],
        shipping_options: [IdMap.getId("shipping_2")]
    }
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
        if (query.shipping_options === IdMap.getId("validId")) {
            return Promise.resolve(profiles.validProfile);
        }
        if (query.products === IdMap.getId("validId")) {
            return Promise.resolve(profiles.validProfile);
        }
        if (query._id === IdMap.getId("validId")) {
            return Promise.resolve(profiles.validProfile);
        }
        if (query._id === IdMap.getId("profile1")) {
            return Promise.resolve(profiles.profile1);
        }
        return Promise.resolve(undefined);
    })
};

export const eventBusService = {
    emit: jest.fn().mockReturnValue(Promise.resolve())
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
    })
};
export const attachRealInstance = {
    onPut: (): any => {
        return {
            reply: (): void => {
                return;
            }
        };
    },
    onPost: (): any => {
        return {
            reply: (): void => {
                return;
            }
        };
    },
    onGet: (): any => {
        return {
            reply: (): void => {
                return;
            }
        };
    },
    onHead: (): any => {
        return {
            reply: (): void => {
                return;
            }
        };
    },
    onDelete: (): any => {
        return {
            reply: (): void => {
                return;
            }
        };
    }
};

let useMockAxios = true;
let mock;
export function enableMocks(): any {
    useMockAxios = true;
    return enableMockFunctions();
}
export function disableMocks(): any {
    return attachRealInstance;
}

function enableMockFunctions(): void {
    const mock = useMockAxios ? new MockAdapter(axios) : attachRealInstance;
    mock.onPut().reply(200);
    mock.onDelete().reply(200);
    mock.onGet("/api/products").reply(200, {
        medusa_id: "exists",
        id: 1,
        title: "test"
    });
    mock.onPost("/api/products").reply(200, {
        medusa_id: "exists",
        id: 1,
        title: "test"
    });
    mock.onPut("/api/products").reply(200, {
        medusa_id: "exists",
        id: 1,
        title: "test-2"
    });
    mock.onDelete("/api/products").reply(200, {});

    mock.onGet("/api/roles").reply(200, {
        id: "2",
        name: "Author"
    });

    mock.onGet("/api/products/exists").reply(200);
    mock.onPost("http://172.31.34.235:1337/admin/login").reply(200, {
        data: {
            token: "jsgfkjdsgsdgsjdgl2343535235",
            user: {
                id: 1,
                firstname: "Medusa",
                lastname: "Commerce",
                username: "SuperUser",
                email: "support@medusa-commerce.com",
                isActive: true,
                blocked: false,
                preferedLanguage: null,
                createdAt: "2022-11-06T04:49:07.491Z",
                updatedAt: "2022-11-06T04:49:07.491Z"
            }
        }
    });

    mock.onPost("/api/auth/local/register").reply(200, {
        jwt: "jsgfkjdsgsdgsjdgl2343535235",
        user: { id: 1, name: "John Smith", email: "John.smith@test.com" }
    });
    mock.onPost("/api/auth/local").reply(200, {
        jwt: "jsgfkjdsgsdgsjdgl2343535235",
        user: { id: 1, name: "John Smith", email: "John.smith@test.com" }
    });

    const authUrl = "/api/auth/";
    const authRegEx = new RegExp(`${authUrl}/*`);
    mock.onPost(authRegEx).reply(200, {
        jwt: "jsgfkjdsgsdgsjdgl2343535235",
        profile: { id: 1, name: "John Smith", email: "John.smith@test.com" }
    });

    mock.onPost("/api/medusa/setup").reply(200);
    const apiUrl = "/api";
    const apiRegEx = new RegExp(`${apiUrl}/*`);
    mock.onPost(apiRegEx).reply(200, {
        jwt: "jsgfkjdsgsdgsjdgl2343535235",
        profile: { id: 1, name: "John Smith", email: "John.smith@test.com" }
    });

    mock.onHead("/_health").reply(200);
    mock.onHead().reply(200);
}

export function mockServer(): Application {
    const app = express();
    app.use(express.json());

    return app;
}
