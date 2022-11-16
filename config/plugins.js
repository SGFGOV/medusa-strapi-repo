
module.exports = ({ env }) => ({
    // ...
    seo: {
      enabled: true,
    },
    
      // ...
      'strapi-plugin-medusajs': {
        enabled: true,
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