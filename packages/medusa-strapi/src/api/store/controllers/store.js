'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  store controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::store.store';
module.exports = createMedusaDefaultController(uid);
