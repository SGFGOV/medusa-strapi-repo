import pluginId from "../../../admin/src/pluginId";

export default {
  kind: 'collectionType',
  collectionName: 'images',
  info: {
    singularName: 'image',
    pluralName: 'images',
    displayName: 'Image',
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
    url: {
      type: 'text',
      required: true,
    },
    metadata: {
      type: 'json',
    },
    product: {
      type: 'relation',
      relation: 'manyToOne',
      target: `plugin::${pluginId}.product`,
      inversedBy: 'images',
    },
  },
};
