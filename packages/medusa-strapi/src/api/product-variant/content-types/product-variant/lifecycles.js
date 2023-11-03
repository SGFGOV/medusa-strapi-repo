'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const axios = require('axios');

module.exports = {
	async beforeUpdate({ params, state, action, model }) {
		if (params.data.updateFrom == 'medusa') state.updateFrom = 'medusa';
	},

	async afterUpdate({ params, state, result, model, action }) {
		let medusaReady = false;
		/*while (!medusaReady) {
			try {
				const response = await axios.head(`${process.env.MEDUSA_BACKEND_URL}/health`);
				medusaReady = response.status < 300 ? true : false;
			} catch (e) {
				handleError(strapi, e);
				return;
			}
		}*/
		const origin = state.updateFrom ?? 'strapi';
		const respondViaPlugin = strapi.plugins['strapi-plugin-medusajs'].service('setup');
		return await respondViaPlugin.sendResult('productVariant', result, origin); /* await axios.post(
    	/*
    await axios.post(
      `${
        process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
      }/hooks/strapi/update-medusa`,
      {
        type: "productVariant",
        data: result.result,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );*/
	},
};
