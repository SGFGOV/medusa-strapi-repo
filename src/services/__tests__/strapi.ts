import StrapiService from "../update-strapi"
import {jest,describe,expect,beforeAll,beforeEach,it} from '@jest/globals'
import { regionService, productService, redisClient, 
  productVariantService, eventBusService } from "../__mocks__/service-mocks";
  import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);

mock.onPut().reply(200);
mock.onGet().reply(200, {
  users: [{ id: 1, name: "John Smith",email:"John.smith@test.com" }],
});

mock.onGet("/api/products").reply(200,{
  id:"product"
})

mock.onPost("/api/auth/local/register").reply(200,
  {
    jwt:"jsgfkjdsgsdgsjdgl2343535235",
    profile: { id: 1, name: "John Smith",email:"John.smith@test.com" }
  })
const authUrl = "/api/auth/"
const authRegEx = new RegExp(`${authUrl}/*`)
mock.onPost(authRegEx).reply(200,
    {
      jwt:"jsgfkjdsgsdgsjdgl2343535235",
      profile: { id: 1, name: "John Smith",email:"John.smith@test.com" }
    });

mock.onPost("/api/medusa/setup").reply(200)
const apiUrl = "/api"
const apiRegEx = new RegExp(`${apiUrl}/*`)
mock.onPost(apiRegEx).reply(200,{
  jwt:"jsgfkjdsgsdgsjdgl2343535235",
  profile: { id: 1, name: "John Smith",email:"John.smith@test.com" }
})
  
mock.onHead("/_health").reply(200);

let service:StrapiService;

describe("StrapiService", () => {
  
    
    service = new StrapiService(
      {
        regionService,
        productService,
        redisClient,
        productVariantService,
        eventBusService,
      },
      {
        strapi_default_username: "test_id",
        strapi_default_password: "master",
        access_token: "test_token",
      }
    )

    const entry = {
      unpublish: jest.fn(async () => {
        return {
          id: "id",
        }
      }),
      archive: jest.fn(async () => {
        return {
          id: "id",
        }
      }),
    }
  
    
    

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe("archiveProductInStrapi", () => {
      const spy = jest.spyOn(service,"getType")
      it("Calls entry.unpublish and entry.archive", async () => {
        const result = await service.createProductInStrapi( "exists" )
        expect(result).toBeDefined();
    
        expect(spy).toHaveBeenCalledTimes(1)
      })

      /*it("Doesn't call entry.unpublish and entry.archive if the product still exists in medusa", async () => {
        await service.createProductInStrapi("exists")

        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })

      it("Doesn't call productService if request should be ignored", async () => {
        await service.({ id: "ignored" })

        expect(productService.retrieve).toHaveBeenCalledTimes(0)
        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })*/
    })
/*
    describe("archiveProductVariantInStrapi", () => {
      it("Calls entry.unpublish and entry.archive", async () => {
        await service.archiveProductVariantInStrapi({ id: "test" })

        expect(entry.unpublish).toHaveBeenCalledTimes(1)
        expect(entry.archive).toHaveBeenCalledTimes(1)
      })

      it("Doesn't call entry.unpublish and entry.archive if the variant still exists in medusa", async () => {
        await service.archiveProductVariantInStrapi({ id: "exists" })

        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })

      it("Doesn't call productVariantService if request should be ignored", async () => {
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

      it("Doesn't call entry.unpublish and entry.archive if the region still exists in medusa", async () => {
        await service.archiveRegionInStrapi({ id: "exists" })

        expect(entry.unpublish).toHaveBeenCalledTimes(0)
        expect(entry.archive).toHaveBeenCalledTimes(0)
      })

      it("Doesn't call RegionService if request should be ignored", async () => {
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
    })
  })*/
})
