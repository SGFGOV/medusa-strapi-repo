
const { getDefaultRoleAssumerWithWebIdentity } = require("@aws-sdk/client-sts")
const { defaultProvider } = require("@aws-sdk/credential-provider-node")

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
      upload: {
        config: {
          provider: 'aws-s3',
          providerOptions: {
            accessKeyId: env('AWS_ACCESS_KEY_ID'),
            secretAccessKey: env('AWS_ACCESS_SECRET'),
            credentialDefaultProvider: !env('AWS_ACCESS_KEY_ID')? defaultProvider({
              roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity,
            }):undefined,
            region: env('S3_REGION'),
            params: {
              Bucket: env('S3_BUCKET'),
            },
            sizeLimit: 250 * 1024 * 1024,
          },
          actionOptions: {
            upload: {},
            uploadStream: {},
            delete: {},
          },
          breakpoints: {
            xlarge: 1920,
            large: 1000,
            medium: 750,
            small: 500,
            xsmall: 64
          },
        },
      },
      email: {
        config: {
          provider: 'sendgrid',
          providerOptions: {
            apiKey: env('SENDGRID_API_KEY'),
          },
          settings: {
            defaultFrom: env('SENDGRID_NOTIFICATION_FROM_ADDRESS'),
            defaultReplyTo: env('SENDGRID_NOTIFICATION_FROM_ADDRESS'),
          },
        },
      },
      sentry: {
        enabled: true,
        config: {
          dsn: env('SENTRY_DSN'),
          sendMetadata: true,
        },
      },
      meilisearch: {
        config: {
          // Your meili host
          host: env('MELISEARCH_HOST'),
          // Your master key or private key
          apiKey: env('MELISEARCH_MASTER_KEY'),
        }
      }
      // ...
    
    // ...
  });