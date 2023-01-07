module.exports = ({ env }) => (
  {
    settings: {
      parser: {
        enabled: "true",
        formLimit: "50mb",
        jsonLimit: "50mb",
        formidable: {
          maxFileSize: 50 * 1024 * 1024, // 50MB
        },
      },
      cache: {
        enabled: true,
        type: "redis",
        maxAge: 2600000,
        models: ["product", "product-collection", "product-type", "country"],
        redisConfig:
          process.env.AWS_ENABLED == "true"
            ? {
                host: process.env.AWS_REDIS_HOST,
                port: process.env.AWS_REDIS_PORT,
              }
            : {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD,
              },
      },
    },
  },
  [
    "strapi::errors",
    {
      name: "strapi::security",
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            "connect-src": ["'self'", "https:", "http:"],
            "img-src": [
              "'self'",
              "data:",
              "blob:",
              "res.cloudinary.com", // cloudinary images
              "lh3.googleusercontent.com", // google avatars
              "platform-lookaside.fbsbx.com", // facebook avatars
              "dl.airtable.com", // strapi marketplace
              `https://${env("AWS_BUCKET")}.s3.${env(
                "AWS_REGION"
              )}.amazonaws.com`,
            ],
            "media-src": [
              "'self'",
              "data:",
              "blob:",
              `https://${env("AWS_BUCKET")}.s3.${env(
                "AWS_REGION"
              )}.amazonaws.com`,
            ],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    "strapi::cors",
    {
      name: "strapi::poweredBy",
      config: {
        poweredBy: "SGF Tech",
      },
    },
    "strapi::logger",
    "strapi::query",
    "strapi::body",
    "strapi::session",
    "strapi::favicon",
    "strapi::public",
  ]
);
