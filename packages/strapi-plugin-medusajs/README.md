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

## Support us 

As much as we love FOSS software, nothing in this world is truely free. We'll be grateful if you can buy our team a coffee (https://www.buymeacoffee.com/uMRqW9NmS9). 