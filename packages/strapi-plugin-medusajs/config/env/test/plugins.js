
module.exports = ({ env }) => ({
    // ...
        
      // ...
    
      'users-permissions': {
        config: {
          jwt: {
            expiresIn: '1h',
          },
        },
      },
      'strapi-plugin-medusajs': {
        enabled: true,
       // resolve: 'SGF-Strapi/node_modules/@strapi/strapi/lib/core/loaders/plugins/../../../../../../../src/plugins/strapi-plugin-medusajs'
       resolve:`${process.cwd()}`
      },
      // ...
    
    // ...
  });