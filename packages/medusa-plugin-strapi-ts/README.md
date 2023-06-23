### 🏠 [Homepage](../../README.md)
# Medusa Plugin Strapi Written in TypeScript

## Getting started

Strapi is an amazing headless cms, this plugin helps bridge the medusajs and strapi. This is based on the medusa-plugin-strapi developed by DeathWish, and additionally implements handshaking between strapi and medusa. 

This plugin hands over control of strapi to Medusa. And medusa is purely used as a content engine. 

## Pre-requisites

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
### strapi configuration  options

#### basic settings - Mandatory
        STRAPI_PROTOCOL: string;  - strapi protocol should be http or https
        STRAPI_SERVER_HOSTNAME: string; - strapi hostname
        STRAPI_MEDUSA_USER: Service account username
        STRAPI_MEDUSA_PASSWORD: Service account password
        STRAPI_MEDUSA_EMAIL: Service account 

        the settings below are necessary to setup a user account

        STRAPI_SUPER_USERNAME: The super user account details, inorder to register new accounts;
        STRAPI_SUPER_PASSWORD: The super user account password
        STRAPI_SUPER_USER_EMAIL: The super user account email 

        STRAPI_PORT: number;
        strapi_secret?: string; - a secret key to encrypt the jwt between medusa and strapi
        strapi_public_key?: string; - a public key if the secret is not used

#### Advanced options	
        strapi_ignore_threshold: number; 
        enable_marketplace?: boolean; ## experiment doesn't do anything at the moment
        enable_auto_retry?: boolean; ## experiment doesn't do anything at the moment
        encryption_algorithm: string;  ## experiment doesn't do anything at the moment
        strapi_healthcheck_timeout?: number;
        auto_start?: boolean; - starts the interface automatically along with medusa, not recommended as the medusa server may not be ready to sync as soon as strapi is ready
        max_page_size?: number;


## Using Strapi Plugin

    Install and fire away

### Start the interface
 
    inside your service you need to call if not autostart enabled
    inside your medusa project folder src/services
    ```
    class YourService extends TransactiontBaseService
    {
        constructor({
            ...
            UpdateStrapiService updateStrapiService
            ...
        })
        {
            ...
            this.updateStrapiService = updateStrapiService
            ...
        }

        // To Start the interface in not autostart enabled
        .....

            async startStrapiService(): Promise<unknown> {
                return await this.updateStrapiService.startInterface();
            }

        // To use Strapi Services internally without using the api
        async stapiAction():Promise<....>
        {
            this.updateStrapiService.theStrapiApiYouWishToCall(...);
        }

    }   
    ```

   
#### Fetch content
    you can fetch content using the api /strapi/content/<content-type>/<medusa_id>
    ```
    //e.g. to fetch a product with details like = {
    //    ...
    //   id:prod_12345
    //   ...
    // }
    await axios.get("/strapi/content/products/prod_12345")
     ```
## Known Issues

1. the tests need to be made a lot more rigorous to catch edge cases

## Cavaets,

the package uses axios retry with a default fixed retry interval of 400seconds for any 429 errors. I'm happy to accept a PR which defines a better way of dealing with 429 errors



## Show your support

I love developing software and building products that are useful. 
I sincerely hope you this project helps you. I'm happy to help if you need support setting this up. 
Give a ⭐️ if this project helped you! Catch me on discord @govdiw

As you might have guessed by now that considerable time and effort has gone into make this product useful to the community at large, and I'd love to keep maintaining and upgrading this. However, As much as we love FOSS software, nothing in this world is truly free. Please help by [sponsoring or supporting the project]. (https://github.com/sponsors/SGFGOV)

***
