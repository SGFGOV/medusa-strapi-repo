'use strict';

/**
 * currency router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::currency.currency', {
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
