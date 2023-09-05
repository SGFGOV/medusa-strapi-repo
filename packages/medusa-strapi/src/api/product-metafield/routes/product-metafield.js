'use strict';

/**
 * product-metafield router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::product-metafield.product-metafield', {
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
