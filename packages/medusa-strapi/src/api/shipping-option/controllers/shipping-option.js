'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 * shipping-option controller
 */

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::shipping-option.shipping-option';
module.exports = createMedusaDefaultController(uid);
