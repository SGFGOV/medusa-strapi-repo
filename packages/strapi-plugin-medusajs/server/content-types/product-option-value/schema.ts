import pluginId from "../../../admin/src/pluginId";

export default {
  kind: 'collectionType',
  collectionName: 'product_option_values',
  info: {
    singularName: 'product-option-value',
    pluralName: 'product-option-values',
    displayName: 'Product Option Value',
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
    value: {
      type: 'string',
    },
    metadata: {
      type: 'json',
    },
    'product-variants': {
      type: 'relation',
      relation: 'oneToMany',
      target: `plugin::${pluginId}.product-variant`,
      mappedBy: 'product-option-value',
    },
    'product-option': {
      type: 'relation',
      relation: 'oneToMany',
      target: `plugin::${pluginId}.product-option`,
      mappedBy: 'product-option-values',
    },
  },
};
