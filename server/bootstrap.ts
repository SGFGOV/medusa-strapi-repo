import { Strapi } from '@strapi/strapi';
import { config, createMedusaRole, deleteAllEntries, enabledCrudOnModels, hasMedusaRole } from './services/setup';
import chalk from 'chalk'

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */



async function hasSuperUser():Promise<boolean> {
  strapi.log.debug(`Checking if Superuser exists`)
  const superAdminRole = await strapi.service('admin::user').exists();
  return superAdminRole?true:false
}

async function createSuperUser():Promise<void> {
  strapi.log.warn("No SuperUser found. Creating Superuser now....")
 
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
          return;
        }

        const superAdminRole = await strapi.service('admin::role').getSuperAdmin();

        if (!superAdminRole) {
          strapi.log.info("Superuser account exists")
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
    
    
  } catch (error) {
    console.error(error)
  }
}






async function isFirstRun(strapi):Promise<boolean> {
  strapi.log.debug("Checking if first run...")
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: "type", 
    name: "setup",
  })
  const initHasRun = await pluginStore.get({ key: "syncHasRun" })
  if (initHasRun) {
    strapi.log.info("Not a first run. Skipping Synchronization.")
  }
  return !initHasRun
}

// function giveMedusaRoleToMedusaUser(medusaUserId, medusaRoleId) {
//   await strapi.query('user', 'users-permissions').update({ id: medusaUserId }, { role: medusaRoleId })
// }
/*
async function setupSync(strapi){
try{
  const firstRun = await isFirstRun(strapi)
  console.log("setting up sync with medusa")


if (firstRun) {
  strapi.log.debug(
    "First run detected! Synchronizing database with Medusa. Please Wait..."
  )
 const syncMedusa = (await import("./plugins/strapi-plugin-medusajs/server/services/setup.js")).default
    
  const isSynced  = await syncMedusa({strapi})
  if (isSynced) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: "type",
      name: "setup",
    })
    await pluginStore.set({ key: "syncHasRun", value: true })
  }
}
}
catch (e)
{
  console.log(e,error)
}

}*/

export default async({ strapi }: { strapi: Strapi }):Promise<void> => {
  
  console.info(chalk.yellow("Attempting to start medusa plugin"))
  config(strapi); 
  try {

    if (!(await hasSuperUser())) {
      await createSuperUser();
      await deleteAllEntries();
    } else {
      strapi.log.info("Found a Superuser account.")
    }

    let medusaRoleId = await hasMedusaRole()

    if (!medusaRoleId) {
         const userServicePlugin =  strapi.plugins[
        "users-permissions"
      ]
      try{
      await userServicePlugin.services["users-permissions"].initialize();
      
      const permissions = await strapi.plugins[
        "users-permissions"
      ].services["users-permissions"].getActions(userServicePlugin)

      // eslint-disable-next-line guard-for-in
      for (const permission in permissions)
    {
      if(permissions[permission].controllers){
      enabledCrudOnModels(permissions[permission].controllers)}
      
    }
    medusaRoleId = await createMedusaRole(permissions)
    
  } catch (e) {
    console.info(chalk.yellowBright("Medusa plugin error "+(e as Error).message))
  }
}
console.info(chalk.green("Medusa plugin successfully started"))
}
catch(e)
{
  console.info(chalk.redBright("Medusa plugin error "+(e as Error).message))
}
  
};
