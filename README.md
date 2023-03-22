


# Strapi-medusa-template for Strapi v4

Bring the power of two awesome open source system together. It comes preloaded with the plugins that you need kick start medusa.  This is a batteries included version of strapi for medusa

## Some Features

I promise to improve the documentation over a period of time. But here is a shortlit

1. AWS Ready - This supports both standard as well as IAM Role based postgres access
2. Loads of useful plugins 
3. Single Sign On With Medusa from the admin
4. Integrated with Medusa to run as slave to medusa. 
5. Docker Ready so go ahead and launch it. You can load the environment file in an S3 and launch it will pick it up during deployment. For now we support pull from only s3. 
6. 

# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-build)

```
npm run build
# or
yarn build
```
### `Testing standalone`

If this passes you schema has been configured correctly. It only checks the schema. 

```
yarn run test
```


## ⚙️ Deployment

Strapi gives you many possible deployment options for your project. Find the one that suits you on the [deployment section of the documentation](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/deployment.html).

### Docker

We've provided a dockerfile and docker compose file build file also for you reference. 

## Configuration 

### Environment Settings

These values will need to be sent in your .env file or equivalent enivorment sttings,
please generate these keys as per the recommended 
To know more about how to create the keys please read this
(https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/configurations/optional/api-tokens.html#usage)

HOST=<your hostname>
PORT=<yous strapi port>
APP_KEYS=<key1>,<key2>,<key3>,<key4>

### Admin Settings

API_TOKEN_SALT=<api salt>
ADMIN_JWT_SECRET=<admin jwt secret> 

### Users-Permissions Plugin Settings

JWT_SECRET=<STRAPI JWT Secret>

### Strapi Medusa Interface

Strapi runs as slave to medusajs. It just makes it easier when there is one boss :)


MEDUSA_STRAPI_SECRET=<MEDUSA JWT SECRET, needs to be the same as that used in medusa project config jwt_secret>
SUPERUSER_USERNAME=<super user name> defaults to  "SuperUser",
SUPERUSER_PASSWORD=<super secret super user password>  defaults to  "MedusaStrapi1",
SUPERUSER_FIRSTNAME=<firstname, coz strapi loves addressing  by firstname>  defaults to  "Medusa",
SUPERUSER_LASTNAME=<well strapi has got to know who the admin daddy or mommy is >  defaults to  "Commerce",
SUPERUSER_EMAIL=<you better have an email address or your not from this century :)>  defaults to  "support@medusa-commerce.com",

All the default values are there too for your refernce. 


### Database Settings

DATABASE_HOST=<database host>
DATABASE_PORT=<database port>
DATABASE_NAME=<database name>
DATABASE_USERNAME=<database username>
DATABASE_PASSWORD=<database password if you are using const string password and not AWS IAM>
DATABASE_SSL=<data base ssl name>
DATABASE_SCHEMA=<postgres database schema name>

### Media Bucket
Media bucket store big chunks of data that you can't hold in the database, they can be uploaded using upload apis
This version comes preinstalled with S3 support 

If you are not using AWS then
S3_ACCESS_KEY_ID=<AWS KEYID>
S3_ACCESS_SECRET_KEY=<AWS KEY SECRET>
S3_BUCKET=<s3 bucket name>
S3_REGION=<your region>

### Senty helps track any issues that your system may encounter
SENTRY_DSN=<DSN>
SENTRY_KEY=<SENTY KEY>
SENTRY_API_KEY=<SENTRY API KEY>
SENTRY_WEBHOOK_SECRET=<SENTRY WEBHOOK SECRET>

### Search

Search is the most critical part of any content system. This comes preconfigured with melisearch

MEILISEARCH_HOST= <MEILISEARCH HOSTNAME>
MEILISEARCH_MASTER_KEY=<MEILISEARCH KEY>

### Redis Cache

This implementation comes preconfigured with redis caching, As medusa already uses redis,
 it was a reasonable assumption that the same redis service can be used for strapi as well

REDIS_HOST=<redis host name>
REDIS_PORT=<redis port>
REDIS_PASSWORD=<redis password>


### Messaging

Sometimes you've got to just send a message, we've preconfigured this with SENDGRID

SENDGRID_API_KEY=<YOUR SENDGRID KEY>
SENDGRID_NOTIFICATION_FROM_ADDRESS=<SENDERS ADDRESS>

### Other Environment settings

You can read about other environment settings that strapi provides [here](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/configurations/optional/environment.html#strapi-s-environment-variables)

# Routes Available

For the full list of routes currently supported by the API
```
use the command npx strapi routes:list
```


## Known issues,

1. Get doesn't support queries, All entities have to be retrieved by via their corresponing medusa id, 
2. Unique fields need to be set by medusa, strapi's unique fields feature has been not used. 
3. Only UID is the strapi provided id. Each strapi id, is mapped to a medusa_id if the data exists in medusa, 
4. Need to convert to typescript
5. Service tests don't check apis that use media types, though api tests cover it all.
6. Testing currently limited to APIs not plugins
7. Product-option title isn't a required field. We will need to access the product option repository and determine the corresponding title. Happy to accept a PR,with tests

## Support us 

As much as we love FOSS software, nothing in this world is truely free. We'll be grateful if you can buy our team a coffee (https://www.buymeacoffee.com/uMRqW9NmS9). 


## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://docs.strapi.io) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

