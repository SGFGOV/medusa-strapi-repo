'use strict';
const handleError = require('../../../utils/utils').handleError;
const controllerfindOne = require('../../../utils/utils').controllerfindOne;

/**
 *  product-tag controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const createMedusaDefaultController = require('../../../utils/utils').createMedusaDefaultController;
const uid = 'api::product-tag.product-tag';
module.exports = createMedusaDefaultController(uid);
