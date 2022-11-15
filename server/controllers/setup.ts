import { Strapi } from '@strapi/strapi';
import {Context} from 'koa'


export default {
  createMedusaUser(ctx:Context,next) {
    console.log("attempting to create medusa user")
    ctx.body = strapi
      .plugin('strapi-plugin-medusajs')
      .service('setup')
      .createMedusaUser(ctx.request.body)
  },

  synchroniseWithMedusa(ctx:Context,next) {
    ctx.body = strapi
      .plugin('strapi-plugin-medusajs')
      .service('setup')
      .synchroniseWithMedusa(ctx)
  },
};
