'use strict';

/**
 * product-tag router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::product-tag.product-tag', {
  "routes": [
    {
      "method": "GET",
      "path": "/product-tags",
      "handler": "product-tag.find",
      "config": {
        "policies": []
      }
    },
    {
      "method": "GET",
      "path": "/product-tags/count",
      "handler": "product-tag.count",
      "config": {
        "policies": []
      }
    },
    {
      "method": "GET",
      "path": "/product-tags/:id",
      "handler": "product-tag.findOne",
      "config": {
        "policies": []
      }
    },
    {
      "method": "POST",
      "path": "/product-tags",
      "handler": "product-tag.create",
      "config": {
        "policies": []
      }
    },
    {
      "method": "PUT",
      "path": "/product-tags/:id",
      "handler": "product-tag.update",
      "config": {
        "policies": []
      }
    },
    {
      "method": "DELETE",
      "path": "/product-tags/:id",
      "handler": "product-tag.delete",
      "config": {
        "policies": []
      }
    }
  ]
});
