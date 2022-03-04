'use strict';

/**
 * fulfillment-provider router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::fulfillment-provider.fulfillment-provider', {
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
