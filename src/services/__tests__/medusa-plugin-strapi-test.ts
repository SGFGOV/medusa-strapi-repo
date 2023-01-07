import StrapiService from "../update-strapi";
import { jest, describe, expect, beforeEach, it } from "@jest/globals";
import {
    regionService,
    productService,
    productTypeService,
    redisClient,
    productVariantService,
    eventBusService,
    storeService,
    logger,
    enableMocks,
    disableMocks
} from "../__mocks__/service-mocks";
import { randomInt } from "crypto";
import { AxiosResponse } from "axios";
import { StrapiMedusaPluginOptions } from "../../types/globals";

// This sets the mock adapter on the default instance

let service: StrapiService;

describe("StrapiService", () => {
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

    describe("create or register admin", () => {
        it("register or login admin", async () => {
            await service.registerOrLoginAdmin();
            expect(service.strapiAdminAuthToken).toBeDefined();
            expect(service.strapiAdminAuthToken.length).toBeGreaterThan(0);
        });
        it("check if default role exists", async () => {
            const roleId = await service.getAuthorRoleId();
            expect(roleId).toBeGreaterThan(0);
        });

        it("register or login default medusa user", async () => {
            const response = await service.registerOrLoginDefaultMedusaUser();
            expect(response.user?.email).toBe(
                strapiConfigParameters.strapi_default_user.email
            );
            // console.log(service.strapiDefaultUserId);
            expect(response.user?.id).toBeDefined();
            expect(response.user?.id).toBeGreaterThan(0);
        }, 300000);
        it("delete medusa user", async () => {
            const response = await service.registerOrLoginDefaultMedusaUser();
            await service.deleteDefaultMedusaUser();
            const result = await service.loginAsDefaultMedusaUser();
            expect(result).toBeUndefined();
        }, 30000);
        it("medusa sync check", async () => {
            const result = await service.startInterface();
            // console.log(result);
            expect(result.status).toBeGreaterThanOrEqual(200);
            expect(result.status).toBeLessThan(300);
        }, 30000);
    });

    describe("create product in strapi", () => {
        const spy = jest.spyOn(service, "getType");

        it("calls product , product type and checks existence of type in strapi", async () => {
            const response = await service.registerOrLoginDefaultMedusaUser();
            const defaultAuthInterface = service.defaultAuthInterface;
            let typeResult = await service.createProductTypeInStrapi(
                "dummy",
                defaultAuthInterface
            );
            expect(response).toBeDefined();
            if (!typeResult) {
                typeResult = await service.getEntitiesFromStrapi({
                    authInterface: defaultAuthInterface,
                    strapiEntityType: "product-types"
                });
            }
            expect(typeResult).toBeDefined();
            const result = await service.createProductInStrapi(
                "exists",
                defaultAuthInterface
            );
            expect(result).toBeDefined();
            expect(spy).toHaveBeenCalled();
            await service.deleteProductInStrapi(
                { id: "exists" },
                defaultAuthInterface
            );
            await service.deleteDefaultMedusaUser();
        }, 600000);
        it(
            "calls product, product variant" +
                " product type and checks existence of type in strapi",
            async () => {
                const response =
                    await service.registerOrLoginDefaultMedusaUser();
                const defaultAuthInterface = service.defaultAuthInterface;
                let typeResult = await service.createProductTypeInStrapi(
                    "dummy",
                    defaultAuthInterface
                );
                expect(response).toBeDefined();
                if (!typeResult) {
                    typeResult = await service.getEntitiesFromStrapi({
                        authInterface: defaultAuthInterface,
                        strapiEntityType: "product-types"
                    });
                }
                expect(typeResult).toBeDefined();
                let result = await service.createProductInStrapi(
                    "exists",
                    defaultAuthInterface
                );
                expect(result).toBeDefined();
                expect(spy).toHaveBeenCalled();

                result = await service.createProductVariantInStrapi(
                    "exists",
                    defaultAuthInterface
                );
                expect(result).toBeDefined();
                expect(spy).toHaveBeenCalled();

                await service.deleteProductVariantInStrapi(
                    { id: "exists" },
                    defaultAuthInterface
                );

                await service.deleteProductInStrapi(
                    { id: "exists" },
                    defaultAuthInterface
                );
                await service.deleteDefaultMedusaUser();
            },
            600000
        );

        it("calls creates and deletes region in strapi", async () => {
            const response = await service.registerOrLoginDefaultMedusaUser();
            const defaultAuthInterface = service.defaultAuthInterface;
            const result = await service.createRegionInStrapi(
                "exists",
                defaultAuthInterface
            );
            expect(result).toBeDefined();
            expect(spy).toHaveBeenCalled();
            await service.deleteRegionInStrapi(
                { id: "exists" },
                defaultAuthInterface
            );
            await service.deleteDefaultMedusaUser();
        }, 600000);

        /* it("Doesn't call entry.unpublish and entry.archive
    if the product still exists in medusa", async () => {
        await service.createProductInStrapi("exists")

        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })

      it("Doesn't call productService if
      request should be ignored", async () => {
        await service.({ id: "ignored" })

        expect(productService.retrieve).toHaveBeenCalledTimes(0)
        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })*/

        /*
    describe("archiveProductVariantInStrapi", () => {
      it("Calls entry.unpublish and entry.archive", async () => {
        await service.archiveProductVariantInStrapi({ id: "test" })

        expect(entry.unpublish).toHaveBeenCalledTimes(1)
        expect(entry.archive).toHaveBeenCalledTimes(1)
      })

      it("Doesn't call entry.unpublish and entry.
      archive if the variant still exists in medusa", async () => {
        await service.archiveProductVariantInStrapi({ id: "exists" })

        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })

      it("Doesn't call productVariantService
       if request should be ignored", async () => {
        await service.archiveProductVariantInStrapi({ id: "ignored" })

        expect(productVariantService.retrieve).toHaveBeenCalledTimes(0)
        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })
    })

    /*describe("archiveRegionInStrapi", () => {
      it("Calls entry.unpublish and entry.archive", async () => {
        await service.archiveRegionInStrapi({ id: "test" })

        expect(entry.unpublish).toHaveBeenCalledTimes(1)
        expect(entry.archive).toHaveBeenCalledTimes(1)
      })

      it("Doesn't call entry.unpublish and entry.
      archive if the region still exists in medusa", async () => {
        await service.archiveRegionInStrapi({ id: "exists" })

        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })

      it("Doesn't call RegionService
      if request should be ignored", async () => {
        await service.archiveRegionInStrapi({ id: "ignored" })

        expect(regionService.retrieve).toHaveBeenCalledTimes(0)
        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })
    })

    describe("archiveEntryWidthId", () => {
      it("Calls archive if entry exists", async () => {
        await service.archiveEntryWidthId("exists")

        expect(entry.unpublish).toHaveBeenCalledTimes(1)
        expect(entry.archive).toHaveBeenCalledTimes(1)
      })
      it("Doesnt call archive if entry doesn't exists", async () => {
        await service.archiveEntryWidthId("onlyMedusa")

        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })
    })*/
    });
});
