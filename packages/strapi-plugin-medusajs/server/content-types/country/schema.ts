import pluginId from "../../../admin/src/pluginId";

export default {
  kind: 'collectionType',
  collectionName: 'countries',
  info: {
    singularName: 'country',
    pluralName: 'countries',
    displayName: 'Country',
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
    iso_2: {
      type: 'string',
      required: true,
      maxLength: 2,
      minLength: 2,
    },
    iso_3: {
      type: 'string',
      required: true,
      maxLength: 3,
      minLength: 3,
    },
    num_code: {
      type: 'integer',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    display_name: {
      type: 'string',
      required: true,
    },
    region: {
      type: 'relation',
      relation: 'manyToOne',
      target: `plugin::${pluginId}.region`,
      inversedBy: 'countries',
    },
    medusa_id: {
      type: 'uid',
    },
  },
};
