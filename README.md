<h1 align="center">Welcome to medus-strapi-repo 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/node-%3E14.17.3-blue.svg" />
  <a href="./docs" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/SGFGOV/medusa-strapi-repo/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/adrien2p/medusa-extender/blob/main/LICENSE"><img alt="Licence" src="https://img.shields.io/github/license/adrien2p/medusa-extender?style=flat" height="20"/></a>
</p>

> Monorepo for all Strapi components to sync with medusa

### 🏠 [Homepage](README.md)

## Introduction

### Why this repo

Hi, as developers we want to be productive quickly. Strapi is an amazing framework for content management, and medusa is the new kid on the block, as an ecommerce engine. Combining the two definitely made sense. The last attempt to combine the two was with strapi v3, which has since been deprecated and strapi v4 is the new standard. 

#### V3 vs V4
To understand this you need a little bit of strapi background
Strapi uses a system of content schemas, unfortunately with a major version upgrade to v4 the old schemas are no longer effective. Moreover, you are unable to take advantage of strapis built in relationship system. In v3 you had to handle one  - many, one to one, many to one relationshs etc manually in your service code. In V4 strapi bakes this capability internally, freeing you from the need to maintain boiler plate code. This and several other enhancements made strapi v4 the true choice. 

In medusa terms, you can easily map a one to many relations between products and product variants in strapi just you do in medusa

#### Why a mono repo

Well the answer is simple, maintainability. Strapi's template based system well its useful but not 100%. I prefer having all the boiler plate code and features like multi langauage support, redis support, and whole bunch of other things baked into my code than having to install them one by one.
There are some closely related components, that though can be used separate from the repo, works best if everything is put together. 
Then the plugin to associate with medusa is closely related to the api structure, yet a different component. 

Moreover it made integration testing much easier. Testing was critical as the number of apis increase, but more on this later. 

## Monorepo organisation

This mono repo houses 4 components. All are under the packages folder. You can read more about the individual components there
1.[medusa-strapi](packages/medusa-strapi/README.md)            - the strapi implementation
2.[medusa-plugin-strapi-ts](packages/medusa-plugin-strapi-ts/README.md)  - the medusa plugin for strapi
3.[strapi-plugin-medusajs](packages/strapi-plugin-medusajs/README.md)   - the strapi plugin to ensure strapi runs as a slave to medusa
4.[strapi-plugin-sso-medusa](packages/strapi-plugin-sso-medusa/README.md) - the strapi plugin to help you can sign into strapi with medusa credentials

## Version info

We support strapi v4.9.2 at the moment with medusa version. 
[Changelog](CHANGELOG.md)

## Prerequisites

- node >16.17.3
- medusa>1.8
- strapi > 4.9.2

## Install
 
This is the easiest bit

clone the repo. 
go to you medusa-strapi folder. 
update the environment variables as noted in the readme of [medusa-strapi](packages/medusa-strapi/README.md)     

execute command
```sh
yarn start
```
## Testing

This tests medusa-strapi and the medusa-plugin-strapi-ts. The other two components don't have tests at the moment

```sh
yarn run test
```

## Author

👤 **Govind Diwakar**

* Website: linkedin.com/in/govindd
* Github: [@SGFGOV](https://github.com/SGFGOV)
* LinkedIn: [@govindd](https://linkedin.com/in/govindd)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/SGFGOV/medusa-strapi-repo/issues). You can also take a look at the [contributing guide](https://github.com/SGFGOV/medusa-strapi-repo/blob/master/CONTRIBUTING.md).

## Show your support

I love developing software and building products that are useful. 
I sincerely hope you this project helps you. I'm happy to help if you need support setting this up. 
Give a ⭐️ if this project helped you! Catch me on discord @govdiw

As you might have guessed by now that considerable time and effort has gone into make this product useful to the community at large, and I'd love to keep maintaining and upgrading this. However, As much as we love FOSS software, nothing in this world is truly free. Please help by [sponsoring or supporting the project]. (https://github.com/sponsors/SGFGOV)

***
