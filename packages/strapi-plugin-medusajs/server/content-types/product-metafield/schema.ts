import pluginId from "../../../admin/src/pluginId";

export default {
  "kind": "collectionType",
  "collectionName": "product_metafields",
  "info": {
    "singularName": "product-metafield",
    "pluralName": "product-metafields",
    "displayName": "Product Metafield",
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
    "value": {
      "type": "json"
    },
    "metadata": {
      "type": "json"
    },
    "product": {
      "type": "relation",
      "relation": "oneToOne",
      "target": `plugin::${pluginId}.product`,
      "mappedBy": "product-metafield"
    }
  }
}
