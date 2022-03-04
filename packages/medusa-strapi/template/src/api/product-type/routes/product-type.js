'use strict';

/**
 * product-type router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::product-type.product-type', {
  "routes": [
    {
      "method": "GET",
      "path": "/product-types",
      "handler": "product-type.find",
      "config": {
        "policies": []
      }
    },
    {
      "method": "GET",
      "path": "/product-types/count",
      "handler": "product-type.count",
      "config": {
        "policies": []
      }
    },
    {
      "method": "GET",
      "path": "/product-types/:id",
      "handler": "product-type.findOne",
      "config": {
        "policies": []
      }
    },
    {
      "method": "POST",
      "path": "/product-types",
      "handler": "product-type.create",
      "config": {
        "policies": []
      }
    },
    {
      "method": "PUT",
      "path": "/product-types/:id",
      "handler": "product-type.update",
      "config": {
        "policies": []
      }
    },
    {
      "method": "DELETE",
      "path": "/product-types/:id",
      "handler": "product-type.delete",
      "config": {
        "policies": []
      }
    }
  ]
});
