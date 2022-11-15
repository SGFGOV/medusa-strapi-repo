/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { jest } from "@jest/globals";


export const regionService = {
  retrieve: jest.fn((id) => {
    if (id === "exists") {
      return Promise.resolve({ id: "exists" });
    }
    return Promise.resolve(undefined);
  }),
};

export const storeService = {
  retrieveByStoreId: jest.fn((id) => {
    if (id === "exists") {
      return Promise.resolve({ id: "exists" });
    }
    return Promise.resolve(undefined);
  }),
};

export const productService = {
  retrieve: jest.fn((id) => {
    if (id === "exists") {
      return Promise.resolve({ id: "exists" });
    }
    return Promise.resolve(undefined);
  }),
};
export const redisClient = {
  get: async (id):Promise<any> => {
    // const key = `${id}_ignore_${side}`
    if (id === "ignored_ignore_strapi") {
      return Promise.resolve({ id });
    }
    return undefined;
  },
  set: async (id):Promise<any> => {
    return Promise.resolve(id);
  },
};
export const productVariantService = {
  retrieve: jest.fn((id) => {
    if (id === "exists") {
      return Promise.resolve({ id: "exists" });
    }
    return Promise.resolve(undefined);
  }),
};
export const eventBusService = {};
export const logger = {

  info: jest.fn((message: any, optionalParams?: any[]) => {
    console.info(message, optionalParams);
  },
  ),
  error: jest.fn((message: any, optionalParams?: any[]) => {
    console.log(message, optionalParams);
  },
  ),
  warn: jest.fn((message: any, optionalParams?: any[]) => {
    console.log(message, optionalParams);
  },
  ),

};
export const attachRealInstance =
{
  onPut: ():any=>{
    return { reply: ():void=>{
      return;
    } };
  },
  onPost: ():any=>{
    return { reply: ():void=>{
      return;
    } };
  },
  onGet: ():any=>{
    return { reply: ():void=>{
      return;
    } };
  },
  onHead: ():any=>{
    return { reply: ():void=>{
      return;
    } };
  },
  onDelete: ():any=>{
    return { reply: ():void=>{
      return;
    } };
  },
};

let useMockAxios = false;
let mock;
export function enableMocks(): any {
  useMockAxios = true;
  return enableMockFunctions();
}
export function disableMocks(): any {
  return attachRealInstance;
}

function enableMockFunctions():void {
  const mock = useMockAxios?new MockAdapter(axios):attachRealInstance;
  mock.onPut().reply(200);
  mock.onDelete().reply(200);
  mock.onGet("/api/products").reply(200, {
    id: "product",
  });

  mock.onGet("/api/roles").reply(200, {
    id: "2",
    name: "Author",
  });

  mock.onGet("/api/products/exists").reply(200);
  mock.onPost("http://172.31.34.235:1337/admin/login").reply(200,
      { data: {
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
          updatedAt: "2022-11-06T04:49:07.491Z",
        },
      } } );

  mock.onPost("/api/auth/local/register").reply(200,
      {
        jwt: "jsgfkjdsgsdgsjdgl2343535235",
        user: { id: 1, name: "John Smith", email: "John.smith@test.com" },
      });
  mock.onPost("/api/auth/local").reply(200,
      {
        jwt: "jsgfkjdsgsdgsjdgl2343535235",
        user: { id: 1, name: "John Smith", email: "John.smith@test.com" },
      });

  const authUrl = "/api/auth/";
  const authRegEx = new RegExp(`${authUrl}/*`);
  mock.onPost(authRegEx).reply(200,
      {
        jwt: "jsgfkjdsgsdgsjdgl2343535235",
        profile: { id: 1, name: "John Smith", email: "John.smith@test.com" },
      });

  mock.onPost("/api/medusa/setup").reply(200);
  const apiUrl = "/api";
  const apiRegEx = new RegExp(`${apiUrl}/*`);
  mock.onPost(apiRegEx).reply(200, {
    jwt: "jsgfkjdsgsdgsjdgl2343535235",
    profile: { id: 1, name: "John Smith", email: "John.smith@test.com" },
  });

  mock.onHead("/_health").reply(200);
  mock.onHead().reply(200);
}
