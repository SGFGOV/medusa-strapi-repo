'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  product-option-value controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::product-option-value.product-option-value';
module.exports = createMedusaDefaultController(uid);
