'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  product-collection controller
 */

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::product-collection.product-collection';
module.exports = createMedusaDefaultController(uid);
