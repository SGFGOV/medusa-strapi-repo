'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  product-legal controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::product-legal.product-legal';
module.exports = createMedusaDefaultController(uid);
