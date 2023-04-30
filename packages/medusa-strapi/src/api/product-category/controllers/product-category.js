'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  product-category controller
 */

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::product-category.product-category';
module.exports = createMedusaDefaultController(uid);
