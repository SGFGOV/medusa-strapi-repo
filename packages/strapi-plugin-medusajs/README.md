### 🏠 [Homepage](../../README.md)
# Strapi plugin strapi-plugin-medusajs

A quick description of strapi-plugin-medusajs.

## Purpose

This plugin is to quickly connect strapi cms with the medusa, to power two awesome open source system,
This plugin decouples bootstrapping and configuration, allowing you greate flexibility. 

## Getting Started

On medusa you need to install the medusa-plugin-strapi-ts, and follow the setup instructions here[https://docs.medusajs.com/add-plugins/strapi/]

On strap in you need to install the strapi-plugin-medusajs
You don't need to create an admin user, the plugin will create a default admin user for you if you don't have one already. You can configure the admin like any other plugin, via environment variables. 

install via yarn

yarn add strapi-plugin-medusajs

then in your strapi project, enable like so

./config/plugins

```

      // ...
      'strapi-plugin-medusajs': {
        enabled: true,
      },
    // other plugins

```

## Troubleshooting
You may encounter an error saying maximum length is 255 in which case change the schema type from string to text.

## Show your support

I love developing software and building products that are useful. 
I sincerely hope you this project helps you. I'm happy to help if you need support setting this up. 
Give a ⭐️ if this project helped you! Catch me on discord @govdiw

As you might have guessed by now that considerable time and effort has gone into make this product useful to the community at large, and I'd love to keep maintaining and upgrading this. However, As much as we love FOSS software, nothing in this world is truly free. Please help by [sponsoring or supporting the project]. (https://github.com/sponsors/SGFGOV)

***
