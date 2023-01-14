import StrapiService from "../update-strapi";
import {
    jest,
    describe,
    expect,
    beforeEach,
    it,
    beforeAll,
    afterAll
} from "@jest/globals";
import {
    regionService,
    productService,
    productTypeService,
    redisClient,
    productVariantService,
    eventBusService,
    logger,
    disableMocks
} from "../__mocks__/service-mocks";
import { StrapiMedusaPluginOptions } from "../../types/globals";
import { query } from "express";
import { StrapiResult } from "../update-strapi";

// This sets the mock adapter on the default instance

let service: StrapiService;
let result: StrapiResult;
jest.setTimeout(60e3);
describe("StrapiService Tests", () => {
    jest.setTimeout(60e3);
    const strapiConfigParameters: StrapiMedusaPluginOptions = {
        encryption_algorithm: "aes-256-cbc",
        strapi_protocol: "http",
        strapi_default_user: {
            username: "testuser15",
            password: "testuser",
            email: "test15@test.com",
            firstname: "test",
            confirmed: true,
            blocked: false,
            provider: "local"
        },
        strapi_host: "172.31.34.235",
        strapi_admin: {
            password: "MedusaStrapi1",
            firstname: "SuperUser",
            email: "support@medusa-commerce.com"
        },
        strapi_port: "1337",
        strapi_secret: "test",
        strapi_public_key: undefined,
        strapi_ignore_threshold: 0
    };

    service = new StrapiService(
        {
            regionService,
            productService,
            redisClient,
            productVariantService,
            productTypeService,
            eventBusService,
            logger
        },
        strapiConfigParameters
    );

    const entry = {
        unpublish: jest.fn(async () => {
            return {
                id: "id"
            };
        }),
        archive: jest.fn(async () => {
            return {
                id: "id"
            };
        })
    };
    const defaultAuthInterface = service.defaultAuthInterface;
    beforeEach(() => {
        disableMocks();
        jest.clearAllMocks();
    });

    describe("health check", () => {
        it("check health", async () => {
            expect(service).toBeDefined();
            expect(service.checkStrapiHealth()).toBeTruthy();
        });
    });

    describe("utils", () => {
        it("test query builder", async () => {
            const testQueryPattern =
                "sort[0]=title%3Aasc&filters[title][$eq]=hello&populate=%2A&" +
                "fields[0]=title&pagination[pageSize]=10&pagination[page]=1&" +
                "publicationState=live&locale[0]=en";

            const query = service._createStrapiRestQuery({
                sort: ["title:asc"],
                filters: {
                    title: {
                        $eq: "hello"
                    }
                },
                populate: "*",
                fields: ["title"],
                pagination: {
                    pageSize: 10,
                    page: 1
                },
                publicationState: "live",
                locale: ["en"]
            });
            expect(query).toBe(testQueryPattern);
        });
    });
    describe("user CURD", () => {
        it("register or login admin", async () => {
            await service.registerOrLoginAdmin();
            expect(service.strapiSuperAdminAuthToken).toBeDefined();
            expect(service.strapiSuperAdminAuthToken.length).toBeGreaterThan(0);
        });
        it("check if default role exists", async () => {
            const roleId = await service.getRoleId("Author");
            expect(roleId).toBeGreaterThan(0);
        });

        it("register or login default medusa user", async () => {
            const creds = await service.registerOrLoginDefaultMedusaUser();
            expect(creds.token).toBeDefined();
        }, 300000);
        it("delete medusa user", async () => {
            await service.deleteDefaultMedusaUser();
            const creds = await service.loginAsDefaultMedusaUser();
            expect(creds).toBeUndefined();
        }, 30000);
    });
    describe("user actions and signal send", () => {
        beforeAll(async () => await service.registerOrLoginDefaultMedusaUser());

        afterAll(async () => {
            await service.deleteDefaultMedusaUser();
        });

        it("medusa sync check", async () => {
            result = await service.startInterface();
            // console.log(result);
            expect(result.status).toBeGreaterThanOrEqual(200);
            expect(result.status).toBeLessThan(300);
        }, 30000);
    });

    describe("product actions", () => {
        beforeAll(async () => await service.registerOrLoginDefaultMedusaUser());

        afterAll(async () => {
            await service.deleteDefaultMedusaUser();
        });

        const spy = jest.spyOn(service, "getType");
        describe("product  creation and update", () => {
            it("product-type-creation", async () => {
                let typeResult = await service.createProductTypeInStrapi(
                    "dummy",
                    defaultAuthInterface
                );
                expect(typeResult).toBeDefined();
                if (typeResult) {
                    typeResult = await service.getEntitiesFromStrapi({
                        authInterface: defaultAuthInterface,
                        strapiEntityType: "product-types"
                    });
                }
                expect(spy).toHaveBeenCalled();
            });

            it("product creation", async () => {
                result = await service.createProductInStrapi(
                    "exists",
                    defaultAuthInterface
                );
                expect(result).toBeDefined();
                expect(result.status).toBe(200);
                expect(result.medusa_id).toBeDefined();
                expect(result).toMatchObject({ medusa_id: "exists" });
                expect(spy).toHaveBeenCalled();
            }, 600000);

            it("product update product ", async () => {
                result = await service.updateProductInStrapi(
                    { id: "exists", title: "new-title" },
                    defaultAuthInterface
                );
                expect(result).toBeDefined();
                expect(result.status).toBe(200);
                expect(spy).toHaveBeenCalled();
            }, 600000);
            it("create metafields in strapi", async () => {
                result = await service.createProductMetafieldInStrapi(
                    { id: "exists", data: { testData: "test" } } as any,
                    defaultAuthInterface
                );
                expect(result).toBeDefined();
                expect(result.status).toBe(200);
                expect(spy).toHaveBeenCalled();
            });
            it("update metafields in strapi", async () => {
                result = await service.updateProductMetafieldInStrapi(
                    { id: "exists", data: { testData: "test-2" } } as any,
                    defaultAuthInterface
                );
                expect(result).toBeDefined();
                expect(result.status).toBe(200);
                expect(spy).toHaveBeenCalled();
            });

            it("create  and update product variant in strapi", async () => {
                result = await service.createProductVariantInStrapi(
                    "exists",
                    defaultAuthInterface
                );
                expect(result).toBeDefined();
                expect(result.status).toBe(200);

                /* expect(result.data).toMatchObject({
                    id: expect.any(Number),
                    data: { title: expect.any(String) },
                    medus_id: expect.any(String)
                });*/

                result = await service.updateProductVariantInStrapi(
                    { id: "exists", title: "test-product-variant-2" },
                    defaultAuthInterface
                );
                expect(result).toBeDefined();
                expect(result.status).toBe(200);

                /* expect(result.data).toMatchObject({
                    id: expect.any(Number),
                    data: { title: "test-product-variant-2" },
                    medus_id: expect.any(String)
                });*/
                expect(spy).toHaveBeenCalled();
            });
        });
        describe("deletions", () => {
            it("clean up product variants ", async () => {
                result = await service.deleteProductVariantInStrapi(
                    {
                        id: "exists"
                    },
                    defaultAuthInterface
                );
                const falseResult = await service.getEntitiesFromStrapi({
                    strapiEntityType: "product-variants",
                    authInterface: defaultAuthInterface,
                    id: result.medusa_id
                });
                expect(falseResult.status).toBe(200);
                expect(falseResult.data?.data.length).toBe(0);
            });
            it("clean up products ", async () => {
                result = await service.deleteProductInStrapi(
                    { id: "exists" },
                    defaultAuthInterface
                );
                expect(result.status).toBe(200);
                let falseResult = await service.getEntitiesFromStrapi({
                    strapiEntityType: "products",
                    authInterface: defaultAuthInterface,
                    id: result.medusa_id
                });
                expect(falseResult.status).toBe(200);
                expect(falseResult.data?.data.length).toBe(0);

                result = await service.deleteProductTypeInStrapi(
                    { id: "dummy" },
                    defaultAuthInterface
                );
                expect(result.status).toBe(200);
                falseResult = await service.getEntitiesFromStrapi({
                    strapiEntityType: "product-types",
                    authInterface: defaultAuthInterface,
                    id: result.medusa_id
                });
                expect(falseResult.status).toBe(200);
                expect(falseResult.data?.data.length).toBe(0);
            });
        });
    });
});
describe("region checks", () => {
    it("CURD Regions in strapi", async () => {
        const creds = await service.registerOrLoginDefaultMedusaUser();
        const defaultAuthInterface = service.defaultAuthInterface;
        expect(creds).toBeDefined();

        result = await service.createEntryInStrapi({
            method: "post",
            type: "countries",
            data: {
                id: "exists",
                name: "IN",
                iso_2: "IN",
                iso_3: "IND",
                display_name: "India",
                num_code: 91
            } as any,
            authInterface: defaultAuthInterface
        });
        expect(result).toBeDefined();
        expect(result.status).toBe(200);
        result = await service.createRegionInStrapi(
            "exists",
            defaultAuthInterface
        );
        expect(result).toBeDefined();
        expect(result.status).toBe(200);
        result = await service.updateRegionInStrapi(
            { id: "exists", name: "new-name" },
            defaultAuthInterface
        );
        expect(result).toBeDefined();
        expect(result.status).toBe(200);
        expect(result).toMatchObject({
            medusa_id: "exists",
            data: { name: "new-name" }
        });
        result = await service.getEntitiesFromStrapi({
            strapiEntityType: "regions",
            authInterface: defaultAuthInterface,
            id: "exists"
        });
        expect(result.status).toBe(200);

        result = await service.deleteRegionInStrapi(
            { id: "exists" },
            defaultAuthInterface
        );
        const falseResult = await service.getEntitiesFromStrapi({
            strapiEntityType: "regions",
            authInterface: defaultAuthInterface,
            id: result.data.deletedData.medusa_id
        });
        expect(falseResult.status != 200).toBeTruthy();
        // expect(falseResult.data?.data.length).toBe(0);
        await service.deleteDefaultMedusaUser();
    }, 600000);
});
describe("admin CURD", () => {
    it("register or login admin", async () => {
        await service.registerOrLoginAdmin();
        expect(service.strapiSuperAdminAuthToken).toBeDefined();
        expect(service.strapiSuperAdminAuthToken.length).toBeGreaterThan(0);
    });
    it("check if default Author role exists", async () => {
        const roleId = await service.getRoleId("Author");
        expect(roleId).toBeGreaterThan(0);
    });
    it("check if default Editor role exists", async () => {
        const roleId = await service.getRoleId("Editor");
        expect(roleId).toBeGreaterThan(0);
    });

    it("register test admin as Author", async () => {
        result = await service.registerAdminUserInStrapi(
            "testAuthor@test.com",
            "test"
        );
        expect(result.status).toBe(201);
        // console.log(service.strapiDefaultUserId);
        //  expect(result.id).toBeDefined();
        //  expect(result.id).toBeGreaterThan(0);
    }, 300000);
    it("find all admin users", async () => {
        result = await service.getAllAdminUserInStrapi();
        expect(result.status).toBe(200);
        // console.log(service.strapiDefaultUserId);
        //  expect(result.id).toBeDefined();
        //  expect(result.id).toBeGreaterThan(0);
    }, 300000);

    it("activate test admin as Author", async () => {
        result = await service.updateAdminUserInStrapi(
            "testAuthor@test.com",
            "test"
        );
        expect(result).toBeDefined();
        expect(result.status).toBe(200);
    }, 300000);
    it("register duplication admin as Editor should fail", async () => {
        result = await service.registerAdminUserInStrapi(
            "testAuthor@test.com",
            "Editor"
        );
        expect(result.status != 201).toBeTruthy();
    }, 300000);
    it("register admin as Editor", async () => {
        result = await service.registerAdminUserInStrapi(
            "testEditor@test.com",
            "Editor"
        );
        expect(result).toBeDefined();
        expect(result.status).toBe(201);
    }, 300000);

    it("delete medusa user", async () => {
        result = await service.deleteAdminUserInStrapi("testEditor@test.com");
        expect(result.status).toBe(200);
        result = await service.getAdminUserInStrapi("testEditor@test.com");
        expect(result.status).toBe(200);
        expect(result.data).toBeUndefined();
        result = await service.deleteAdminUserInStrapi("testAuthor@test.com");
        expect(result.status).toBe(200);
        result = await service.getAdminUserInStrapi("testAuthor@test.com");
        expect(result.status).toBe(200);
        expect(result.data).toBeUndefined();
        result = await service.getAdminUserInStrapi("testEditor@test.com");
        expect(result.status).toBe(200);
        expect(result.data).toBeUndefined();
    }, 30000);
});
