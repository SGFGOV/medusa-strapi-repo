'use strict';

const google = require('./google')
const cognito = require('./cognito')
const medusa  = require ('./medusa')
const role = require('./role')

module.exports = {
  google,
  cognito,
  medusa,
  role
};
