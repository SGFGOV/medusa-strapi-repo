/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Context } from 'koa';

export default {
	async createMedusaUser(ctx: Context) {
		console.log('attempting to create medusa user');
		ctx.body = await strapi
			.plugin('strapi-plugin-medusajs')
			.service('setup')
			.verifyOrCreateMedusaUser(ctx.request.body);
		return ctx.body;
	},

	async synchroniseWithMedusa(ctx: Context) {
		ctx.body = await strapi.plugin('strapi-plugin-medusajs').service('setup').synchroniseWithMedusa({ strapi });
		return ctx.body;
	},
};
