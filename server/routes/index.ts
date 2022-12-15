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
         auth:false,
        },
      },
    
];

export default routes