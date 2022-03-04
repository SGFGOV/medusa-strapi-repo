'use strict';

/**
 * payment-provider router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::payment-provider.payment-provider', {
  "routes": [
    {
      "method": "GET",
      "path": "/payment-providers",
      "handler": "payment-provider.find",
      "config": {
        "policies": []
      }
    },
    {
      "method": "GET",
      "path": "/payment-providers/count",
      "handler": "payment-provider.count",
      "config": {
        "policies": []
      }
    },
    {
      "method": "GET",
      "path": "/payment-providers/:id",
      "handler": "payment-provider.findOne",
      "config": {
        "policies": []
      }
    },
    {
      "method": "POST",
      "path": "/payment-providers",
      "handler": "payment-provider.create",
      "config": {
        "policies": []
      }
    },
    {
      "method": "PUT",
      "path": "/payment-providers/:id",
      "handler": "payment-provider.update",
      "config": {
        "policies": []
      }
    },
    {
      "method": "DELETE",
      "path": "/payment-providers/:id",
      "handler": "payment-provider.delete",
      "config": {
        "policies": []
      }
    }
  ]
});
