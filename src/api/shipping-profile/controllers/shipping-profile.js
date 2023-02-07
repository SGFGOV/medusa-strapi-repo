"use strict";
const handleError = require("../../../utils/utils").handleError;
const controllerfindOne = require("../../../utils/utils").controllerfindOne;

/**
 *  shipping-profile controller
 */

const createMedusaDefaultController =
  require("../../../utils/utils").createMedusaDefaultController;
const uid = "api::shipping-profile.shipping-profile";
module.exports = createMedusaDefaultController(uid);
