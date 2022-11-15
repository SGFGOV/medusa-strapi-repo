<!--lint disable awesome-list-item-->
<div align="center">
  <p align="center">
    <img alt="Medusa" src="https://uploads-ssl.webflow.com/61fba9f6deac297b7b22017d/62000006ce573a706c92546c_logo.svg" width="200" />
  </p>
  <h1>Plugin starter (Typescript)</h1>
  <p>Start to write your own plugin as quick as possible</p>
    
  <a href="https://github.com/adrien2p/awesome-medusajs">
      <img src="https://awesome.re/badge.svg" alt="Awesome">
  </a>
</div>

# Getting started

you need to install the strap-plugin-medusajs and enable it in strapi. 

Installation

```bash
yarn add medusa-plugin-strapi-ts
```



# Usage

## Api

### Admin routes

Those routes will automatically be attached by medusa to the `admin` path.

### Store routes

Those routes will automatically be attached by medusa to the `store` path.

### Custom routes

All those routes are added in the main router and you have to manage them.

## Models/Migrations

Those models will be attach to the manager and included into the medusa container.
The migrations will be applied automatically.

## Subscribers

It acts like a service but its main purpose is to extends core flow depending on the
events you want to listen to.

## Services

Those services will be automatically added to the medusa container and will be available
in any other service through the constructor injection.

## Loaders

Those will be applied during the loading and allow you to register custom components
to the container to be accessible later on.

# Deployment

Once your plugin is done. 

```bash
npm run build && npm version && npm publish
```

You can now install it into your project file `medusa-config`.
