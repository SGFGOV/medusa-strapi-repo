'use strict';
const chalk = require('chalk');

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {

    try {
 
      const params = {
        username: process.env.SUPERUSER_USERNAME || "SuperUser",
        password: process.env.SUPERUSER_PASSWORD || "MedusaStrapi1",
        firstname: process.env.SUPERUSER_FIRSTNAME || "Medusa",
        lastname: process.env.SUPERUSER_LASTNAME || "Commerce",
        email: process.env.SUPERUSER_EMAIL || "support@medusa-commerce.com",
        blocked: false,
        isActive: true,
      }
    
          const hasAdmin = await strapi.service('admin::user').exists();
  
          if (hasAdmin) {
            console.log(chalk.bold("Found super admin user"))
          }
          else{
          
            const superAdminRole = await strapi.service('admin::role').getSuperAdmin();
  
          if (!superAdminRole) {
            strapi.log.info("Superuser role exists")
            return;
          }
  
          await strapi.service('admin::user').create({
            email: params.email,
            firstname: params.firstname,
            username:params.username,
            lastname: params.lastname,
            password: params.password,
            registrationToken: null,
            isActive: true,
            roles: superAdminRole ? [superAdminRole.id] : [],
          });
      
          strapi.log.info("Superuser account created")
        }}
        catch(err)
        {
          console.log(err)
        }
      
        try {
          console.log(chalk.bold("bootstrap completed"))
        } catch (error) {
          console.log(error);
        }
  },

  
};
