'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  product-document controller
 */

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::product-document.product-document';
module.exports = createMedusaDefaultController(uid);
