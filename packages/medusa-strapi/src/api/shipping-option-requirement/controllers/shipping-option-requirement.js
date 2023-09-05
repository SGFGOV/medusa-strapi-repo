'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  shipping-option-requirement controller
 */
const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::shipping-option-requirement.shipping-option-requirement';
module.exports = createMedusaDefaultController(uid);
