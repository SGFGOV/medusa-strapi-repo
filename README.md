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

## An Appeal
## Medusa-Strapi: Embrace the Power of Empathy in Content Management! 🚀

Hey there, Supporter! 👋

Welcome to the world of Medusa-Strapi, the perfect companion to the MedusaJS e-commerce framework! As we set out to make a lasting impact in the digital realm, we invite you to join our journey and experience the magic of empathetic content management.

Medusa-Strapi is not just any content management system; it's a heartfelt project that empowers creators and businesses to thrive alongside the MedusaJS e-commerce framework. Together, we're on a mission to simplify content management while embracing the principles of empathy and collaboration.

### Why We Need Your Help:

Through Medusa-Strapi, we've already witnessed the profound impact it's had on countless lives. Businesses can now craft compelling stories with ease, while developers find joy in building seamless experiences. Together, we've saved valuable hours, giving individuals the freedom to focus on what truly matters.

### You Can Make a Difference:

Your support, no matter the size - whether it's a generous $5 or a magnificent $10 - fuels our quest. With your backing, we can:

- **Empower Dreams:** Behind every line of code lies a dream - the dream of a developer leaving an indelible mark, a small business flourishing, or a content creator inspiring the world. Your support brings these dreams to life, turning them into awe-inspiring realities.

- **Craft Simplicity:** We believe in technology that empowers, not complicates. Your kindness helps us build an intuitive content management system, allowing businesses to effortlessly create and manage content.

- **Celebrate Humanity:** Medusa-Strapi is not just software; it's a vibrant community driven by empathy. Your support strengthens these bonds, fostering a space where ideas flourish, and hearts unite.

### Join Our Journey:

Be a part of Medusa-Strapi's story and the FOSS movement. 🌟 Embrace the spirit of openness, collaboration, and shared growth. Together, let's empower this journey, making an indelible impact on countless lives.

[![GitHub Sponsors](https://img.shields.io/github/sponsors/SGFGOV/medusa-strapi-repo?label=Sponsor%20Medusa-Strapi&style=social)](https://github.com/sponsors/SGFGOV)

Ready to join the ranks of change-makers? 🚀 Pledge your support or learn more at [github.com/SGFGOV/medusa-strapi-repo](https://github.com/SGFGOV/medusa-strapi-repo).

Embrace the power of empathy in Medusa-Strapi's journey today! 💫

With heartfelt gratitude,

Govind
Medusa-Strapi Team 🤝


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
 
This is the easiest bit

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

## Show your support

I love developing software and building products that are useful. 
I sincerely hope you this project helps you. I'm happy to help if you need support setting this up. 
Give a ⭐️ if this project helped you! Catch me on discord @govdiw

As you might have guessed by now that considerable time and effort has gone into make this product useful to the community at large, and I'd love to keep maintaining and upgrading this. However, As much as we love FOSS software, nothing in this world is truly free. Please help by [sponsoring or supporting the project]. (https://github.com/sponsors/SGFGOV)

***
