'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::image.image', ({ strapi }) => ({
  async handleManyToManyRelation(images) {
    const strapiImagesIds = [];

    try {
      for (let image of images) {
        image.medusa_id = image.id.toString();
        delete image.id;

        const found = await strapi.query('image', '').findOne({
          medusa_id: image.medusa_id
        })

        if (found) {
          strapiImagesIds.push({ id: found.id });
          continue;
        }

        const create = await strapi.services['image'].create(image);
        strapiImagesIds.push({ id: create.id });
      }
    } catch (e) {
      console.log(e);
      throw new Error('Delegated creation failed');
    }
    return strapiImagesIds;
  }
}));
