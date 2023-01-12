"use strict";
const handleError = require("../../../utils/utils").handleError;
const controllerfindOne = require("../../../utils/utils").controllerfindOne;

/**
 *  payment-provider controller
 */

const createMedusaDefaultController =
  require("../../../utils/utils").createMedusaDefaultController;
const uid = "api::payment-provider.payment-provider";
module.exports = createMedusaDefaultController(uid);
