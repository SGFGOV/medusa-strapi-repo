
module.exports = ({ env }) => ({
    // ...
    seo: {
      enabled: true,
    },
    
      // ...
      'strapi-plugin-medusajs': {
        enabled: true,
        resolve: './src/plugins/strapi-plugin-medusajs'
      },
      'users-permissions': {
        config: {
          jwt: {
            expiresIn: '1h',
          },
        },
      },
      // ...
    
    // ...
  });