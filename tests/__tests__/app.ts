
import {beforeAll,afterAll,expect,it} from "@jest/globals"

/* const beforeAll = require('@jest/globals').beforeAll;
const afterAll = require('@jest/globals').afterAll;
const expect = require('@jest/globals').expect;
*/

import  { setupStrapi, cleanupStrapi } from "../helpers/strapi"
import {config, hasMedusaRole} from "../../server/services/setup"
let strapi:any;
beforeAll(async () => {
  strapi = await setupStrapi()
  config(strapi);
});

afterAll(async () => {
  strapi = await cleanupStrapi();
});

it("strapi is defined", () => {
  expect(strapi).toBeDefined();
});

it("check if Medusa Role exists in New Instance", async ()=>{
const result = await hasMedusaRole();
  expect(result).toBe(false);
})
/*
it("check if create medusa Role exists in New Instnace", async ()=>{
  const plugins = await strapi.plugins[
    "users-permissions"
  ].services["users-permissions"].initialize();
  const permissions = await strapi.plugins[
    "users-permissions"
  ].services["users-permissions"].getActions(plugins)
  const result = await createMedusaRole(permissions);
    expect(result).toBeGreaterThan(0);
  }
  
)*/