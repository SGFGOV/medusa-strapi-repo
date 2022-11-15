import sync from "../policies/sync"

const routes =  [
  {
  method: 'POST',
    path: '/create-medusa-user',
    handler: 'setup.createMedusaUser',
    config: {
      auth: false,
    },
  },
    {
      method: 'POST',
        path: '/synchronise-medusa-tables',
        handler: 'setup.synchroniseWithMedusa',
        config: {
          policies: [],
        },
      },
    
];

export default routes