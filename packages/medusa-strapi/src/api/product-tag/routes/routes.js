'use strict';

/**
 * product-tag router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::product-tag.product-tag', {
	prefix: '',
	only: ['find', 'findOne', 'create', 'update', 'delete'],
	except: [],
	config: {
		find: {
			auth: false,
			policies: [],
			middlewares: [],
		},
		findOne: {},
		create: {},
		update: {},
		delete: {},
	},
});
