import {Context} from 'koa'


export default {
  createMedusaUser(ctx:Context) {
    console.log("attempting to create medusa user")
    ctx.body = strapi
      .plugin('strapi-plugin-medusajs')
      .service('setup')
      .createMedusaUser(ctx.request.body)
  },

  synchroniseWithMedusa(ctx:Context) {
    ctx.body = strapi
      .plugin('strapi-plugin-medusajs')
      .service('setup')
      .synchroniseWithMedusa({strapi})
  },
};
