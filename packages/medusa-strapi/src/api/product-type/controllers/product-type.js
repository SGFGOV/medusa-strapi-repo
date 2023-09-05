'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  product-type controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::product-type.product-type';
module.exports = createMedusaDefaultController(uid);
