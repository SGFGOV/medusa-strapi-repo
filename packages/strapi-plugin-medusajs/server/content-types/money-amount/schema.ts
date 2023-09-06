import pluginId from "../../../admin/src/pluginId";

export default {
  kind: 'collectionType',
  collectionName: 'money_amounts',
  info: {
    singularName: 'money-amount',
    pluralName: 'money-amounts',
    displayName: 'Money Amount',
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
    amount: {
      type: 'biginteger',
      required: true,
    },
    currency_code: {
      type: 'uid',
      required: true,
      maxLength: 3,
      minLength: 3,
    },
    sale_amount: {
      type: 'biginteger',
    },
    'product-variants': {
      type: 'relation',
      relation: 'oneToMany',
      target: `plugin::${pluginId}.product-variant`,
      mappedBy: 'money-amount',
    },
  },
};
