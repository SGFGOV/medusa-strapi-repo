'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const handleError = require('../../../../utils/utils').handleError;
const axios = require('axios');

module.exports = {
	async afterUpdate(result, params, data) {
		let medusaReady = false;
		while (!medusaReady) {
			try {
				const response = await axios.head(`${process.env.MEDUSA_BACKEND_URL}/health`);
				medusaReady = response.status < 300 ? true : false;
			} catch (e) {
				handleError(strapi, e);
				return;
			}
		}

		const respondViaPlugin = strapi.plugins['strapi-plugin-medusajs'].service('setup');
		return await respondViaPlugin.sendResult('product', result.result); /* await axios.post(
      `${
        process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
      }/hooks/strapi/update-medusa`,
      {
        type: "product",
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
