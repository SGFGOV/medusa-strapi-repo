import pluginId from "../../../admin/src/pluginId";

export default {
  "kind": "collectionType",
  "collectionName": "product_collections",
  "info": {
    "singularName": "product-collection",
    "pluralName": "product-collections",
    "displayName": "Product Collection",
    "description": ""
  },
  "options": {
    "increments": true,
    "timestamps": true,
    "draftAndPublish": true,
    "comment": ""
  },
  "pluginOptions": {
    "versions": {
      "versioned": true
    }
  },
  "attributes": {
    "medusa_id": {
      "type": "uid"
    },
    "title": {
      "type": "string",
      "required": true
    },
    "handle": {
      "type": "string",
      "required": false
    },
    "metadata": {
      "type": "json"
    },
    "products": {
      "type": "relation",
      "relation": "oneToMany",
      "target": `plugin::${pluginId}.product`,
      "mappedBy": "product-collection"
    }
  }
}
