
# Medusa Plugin Strapi Writtent in TypeScript

## Getting started

Strapi is an amazing headless cms, this plugin helps bridge the medusajsa and strapi. This is based on the medusa-plugin-strapi developed by DeathWish, and additionally implements handshaking between strapi and medusa. 

This plugin hands over control of strapi to Medusa. And medusa is purely used as a content engine. 

## Pre-requisities

You need to install the strapi-plugin-medusajs and enable it in strapi and follow the instructions in its readme file. 

## Installation

```bash
yarn add medusa-plugin-strapi-ts
```
## configuration


You can register the plugin like so
```

{
            resolve: "medusa-plugin-strapi-ts",
            options: {
                ...strapiOptions
            }
},


```

where the strapiOptions will be like 

```
const strapiOptions = 
    {
        encryption_algorithm: "aes-256-cbc",
        strapi_protocol: process?.env?.STRAPI_PROTOCOL,
        strapi_default_user: {
            username: process?.env?.STRAPI_MEDUSA_USER,
            password: process?.env?.STRAPI_MEDUSA_PASSWORD,
            email: process?.env?.STRAPI_MEDUSA_EMAIL,
            confirmed: true,
            blocked: false,
            provider: "local"
        },
        strapi_host: process?.env?.STRAPI_SERVER_HOSTNAME,
        strapi_admin: {
            username:
                process?.env?.STRAPI_SUPER_USERNAME ||
                "SuperUser",
            password:
                process?.env?.STRAPI_SUPER_PASSWORD ||
                "MedusaStrapi1",
            email:
                process?.env?.STRAPI_SUPER_USER_EMAIL ||
                "support@medusa-commerce.com"
        },
        strapi_port: process?.env?.STRAPI_PORT,
        strapi_secret: process?.env?.STRAPI_SECRET,
        strapi_public_key: process?.env?.STRAPI_PUBLIC_KEY,
        strapi_ignore_threshold: 3
    }

```


## Usage


## Support us 

As much as we love FOSS software, nothing in this world is truely free. We'll be grateful if you can buy our team a coffee (https://www.buymeacoffee.com/uMRqW9NmS9). 