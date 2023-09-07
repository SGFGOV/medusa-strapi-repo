<h1 align="center">Welcome to medusa-strapi-repo 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/node-%3E16.17.2-blue.svg" />
  <a href="./docs" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/SGFGOV/medusa-strapi-repo/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/adrien2p/medusa-extender/blob/main/LICENSE"><img alt="Licence" src="https://img.shields.io/github/license/adrien2p/medusa-extender?style=flat" height="20"/></a>
</p>

# Monorepo for all strapi components to sync with medusa

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

This mono repo houses 5 components. All are under the packages folder. You can read more about the individual components there
1. [medusa-strapi](packages/medusa-strapi/README.md)            - the strapi implementation
2. [medusa-plugin-strapi-ts](packages/medusa-plugin-strapi-ts/README.md)  - the medusa plugin for strapi
3. [strapi-plugin-medusajs](packages/strapi-plugin-medusajs/README.md)   - the strapi plugin to ensure strapi runs as a slave to medusa
4. [strapi-plugin-sso-medusa](packages/strapi-plugin-sso-medusa/README.md) - the strapi plugin to help you can sign into strapi with medusa credentials
5. [strapi-plugin-multi-country-select](packages/strapi-plugin-multi-country-select/README.md) - this is a small admin tool to enable multiple countries to be selected. This was initially a separate repo, but now has been merged with this to ensure consistent builds.

## Version info

We support strapi v4.10.5 at the moment with medusa version. 
[Changelog](CHANGELOG.md)

## Prerequisites

- node   > 16.17.3
- medusa > 1.8
- strapi > 4.11.7
- postgres > 12

## Install
 
This is the easiest 

#### NOTE: Please don't use create strapi-app, there will be too many configuration changes

1. Clone the repo. 
2. Go to the medusa-strapi folder inside <yourrepo>/packages/medusa-strapi
3. Create a .env file. Update the environment variables as noted in the readme of [medusa-strapi](packages/medusa-strapi/README.md)     
4. Run yarn run build



### Deployment - Container

I recommend using docker and setting the environment variables as per the docker container deployment environment that you are using

### Deployment - Local
Go to the medusa-strapi folder inside /packages/medusa-strapi and execute command
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

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/SGFGOV/medusa-strapi-repo/issues). You can also take a look at the [contributing guide](./CONTRIBUTING.md).

***
## An Appeal
## Medusa-Strapi: Unlock Developer Efficiency: Sponsor Our MedusaJS - Strapi CMS! 🚀

Dear Fellow Developer,

I hope this message finds you well. I'm excited to introduce you to a project that promises to be a game-changer for developers working on MedusaJS projects – our Strapi-based CMS Solution for MedusaJs.

In the world of web development, time is of the essence, and our CMS solution is designed with this in mind. By using our solution, developers around the globe can save valuable hours when working on their MedusaJS projects. Imagine having a tool at your disposal that streamlines content management, allowing you to focus on what truly matters – creating exceptional e-commerce experiences.

But the benefits don't stop there. Our CMS is engineered to enhance developer productivity. It offers a user-friendly interface, intuitive content management, and seamless integration with MedusaJS. This means fewer roadblocks, faster development cycles, and ultimately, more successful e-commerce projects.

Your sponsorship, regardless of its size, will help us bring this powerful tool to developers like you everywhere. It will enable us to refine and expand the CMS Solution, making it an indispensable asset for the MedusaJS community.

By supporting us, you're not just investing in a project; you're investing in the collective efficiency and productivity of developers worldwide. You're making it possible for them to deliver exceptional e-commerce solutions faster and more effectively.

To be a part of this journey and empower developers globally, please visit our GitHub sponsorship page [![GitHub Sponsors](https://img.shields.io/github/sponsors/SGFGOV?label=Sponsor%20Medusa-Strapi&style=social)](https://github.com/sponsors/SGFGOV)
. Your support will make a tangible difference in the lives of countless developers.

Thank you for considering our request. We're enthusiastic about the impact this project can have, and we genuinely appreciate your support.


With heartfelt gratitude,

SGFGOV

