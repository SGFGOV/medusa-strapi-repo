'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const axios = require('axios');

module.exports = {
	async afterUpdate(result, params, data) {
		let medusaReady = false;
		/*while (!medusaReady) {
			try {
				const response = await axios.head(`${process.env.MEDUSA_BACKEND_URL}/health`);
				medusaReady = response.status < 300 ? true : false;
			} catch (e) {
				console.log('awaiting medusa to start');
				return;
			}
		}*/
		const respondViaPlugin = strapi.plugins['strapi-plugin-medusajs'];
		const theService = respondViaPlugin.service('setup');
		return await theService.sendResult('region', result.result); /* await axios.post(
      `${
        process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
      }/hooks/strapi/update-medusa`,
      {
        type: "region",
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
