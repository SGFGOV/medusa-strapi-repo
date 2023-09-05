'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  money-amount controller
 */

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;

const uid = 'api::money-amount.money-amount';
module.exports = createMedusaDefaultController(uid);
