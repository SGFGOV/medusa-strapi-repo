import pluginId from "../../../admin/src/pluginId";

export default {
  kind: 'collectionType',
  collectionName: 'fulfillment_providers',
  info: {
    singularName: 'fulfillment-provider',
    pluralName: 'fulfillment-providers',
    displayName: 'Fulfillment Provider',
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
    is_installed: {
      type: 'boolean',
      default: true,
      required: true,
    },
    regions: {
      type: 'relation',
      relation: 'manyToMany',
      target: `plugin::${pluginId}.region`,
      mappedBy: 'regions',
    },
    'shipping-options': {
      type: 'relation',
      relation: 'manyToMany',
      target: `plugin::${pluginId}.shipping-option`,
      mappedBy: 'shipping-options',
    },
  },
};
