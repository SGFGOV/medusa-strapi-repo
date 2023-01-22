const request = require("supertest");
const {
  executeLoginAsStrapiAdmin,
  userTestCreds,
  authCreds,
} = require("../helpers/strapi");

const adminEmail = process.env.SUPERUSER_EMAIL;
const adminPassword = process.env.SUPERUSER_PASSWORD;

function otherTests() {
  describe("medusa-plugin-api-tests", () => {
    it("testing-sycn", async () => {
      const response = await executeLoginAsStrapiAdmin(
        adminEmail,
        adminPassword,
        // eslint-disable-next-line no-undef
        strapi
      );
      expect(response.status).toBe(200);
      const adminToken = response.body?.data?.token;
      // eslint-disable-next-line no-undef
      const registeredUser = await request(strapi.server.httpServer)
        .post(`/strapi-plugin-medusajs/create-medusa-user`)
        .send(userTestCreds)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(registeredUser.status).toBe(200);

      // eslint-disable-next-line no-undef
      const creds = await request(strapi.server.httpServer)
        .post(`/api/auth/local`)
        .send(authCreds);
      expect(creds.status).toBe(200);

      // eslint-disable-next-line no-undef
      const r = await request(strapi.server.httpServer)
        .post(`/strapi-plugin-medusajs/synchronise-medusa-tables`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(r.status).toBe(200);
    });
  });
}

module.exports = otherTests;
