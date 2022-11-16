

module.exports = ({ env }) => ({
  settings: {
    parser: {
      enabled:"true",
      formLimit: '50mb',
      jsonLimit: '50mb',
      formidable: {
          maxFileSize: 50 * 1024 * 1024, // 50MB
      },
  },
    cache: {
      enabled: true,
      type: 'redis',
      maxAge: 2600000,
      models: ['product','product-collection','product-type','country'],
      redisConfig: process.env.AWS_ENABLED=="true"?{
        host: process.env.AWS_REDIS_HOST,
        port: process.env.AWS_REDIS_PORT,
       
    }:{
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password:process.env.REDIS_PASSWORD,
      }
    
    
  }
}
},
[
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  {
    name: 'strapi::poweredBy',
    config: {
      poweredBy: 'SGF Tech'
    },
  },
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
]);
