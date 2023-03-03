/* eslint-disable no-undef */

const { setupStrapi, cleanupStrapi } = require('./helpers/strapi');
jest.setTimeout(3e6);
beforeAll(async () => {
	await setupStrapi();
});

afterAll(async () => {
	await cleanupStrapi();
});

describe('Checking if app and schemas are valid', () => {
	it('strapi is defined', () => {
		expect(strapi).toBeDefined();
	}, 10000);
});
