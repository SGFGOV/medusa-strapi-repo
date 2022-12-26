/* eslint-disable no-undef */
const request = require('supertest');
const { setupStrapi, cleanupStrapi } = require("./helpers/strapi");
jest.setTimeout(3e6)
beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await cleanupStrapi();
});

it("strapi is defined", () => {
  expect(strapi).toBeDefined();
},10000);

it("should return 200", async () => {
    await request(strapi.server.httpServer)
      .get("/api/countries")
      .expect(200) // Expect response http code 200
  });