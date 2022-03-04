'use strict';

/**
 * shipping-profile router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::shipping-profile.shipping-profile', {
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
