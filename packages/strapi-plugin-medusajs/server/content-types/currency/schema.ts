import pluginId from "../../../admin/src/pluginId";

export default {
  kind: 'collectionType',
  collectionName: 'currencies',
  info: {
    singularName: 'currency',
    pluralName: 'currencies',
    displayName: 'Currency',
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
    code: {
      type: 'uid',
      required: true,
      maxLength: 3,
      minLength: 3,
    },
    symbol: {
      type: 'string',
      required: true,
    },
    symbol_native: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    regions: {
      type: 'relation',
      relation: 'oneToMany',
      target: `plugin::${pluginId}.region`,
      mappedBy: 'currency',
    },
  },
};
