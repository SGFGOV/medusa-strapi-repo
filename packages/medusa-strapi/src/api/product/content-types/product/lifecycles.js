'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const handleError = require('../../../../utils/utils').handleError;
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
		return await respondViaPlugin.sendResult('product', result, origin); /* await axios.post(
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
	async beforeDelete(event) {
		const { params, result, model, action, state } = event;
		const { data, where, select, populate } = event.params;

		const entity = await strapi.entityService.findOne('api::product.product', where.id, { populate: '*' });

		const deleteOptions = entity.product_options?.map(async (option) => {
			await strapi.entityService.delete('api::product-option.product-option', option.id);
		});

		const deleteVariants = entity.product_variants?.map(async (variant) => {
			await strapi.entityService.delete('api::product-variant.product-variant', variant.id);
		});
		if (deleteOptions) await Promise.all(deleteOptions);
		if (deleteVariants) await Promise.all(deleteVariants);
	},
};
