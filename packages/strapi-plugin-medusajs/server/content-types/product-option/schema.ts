import pluginId from "../../../admin/src/pluginId";

export default {
  kind: 'collectionType',
  collectionName: 'product_options',
  info: {
    singularName: 'product-option',
    pluralName: 'product-options',
    displayName: 'Product Option',
    description: '',
  },
  options: {
    increments: true,
    timestamps: true,
    draftAndPublish: true,
    comment: '',
  },
  pluginOptions: {
    versions: {
      versioned: true,
    },
  },
  attributes: {
    medusa_id: {
      type: 'uid',
    },
    title: {
      type: 'string',
      required: true,
    },
    metadata: {
      type: 'json',
    },
    'product-option-values': {
      type: 'relation',
      relation: 'manyToOne',
      target: `plugin::${pluginId}.product-option-value`,
      inversedBy: 'product-option',
    },
    product: {
      type: 'relation',
      relation: 'manyToOne',
      target: `plugin::${pluginId}.product`,
      inversedBy: 'product-options',
    },
  },
};
