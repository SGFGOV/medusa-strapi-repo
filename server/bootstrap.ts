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
  const superAdminRole = await strapi.service('admin::user')?.exists();
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
  
        const hasAdmin = await strapi.service('admin::user')?.exists();

        if (hasAdmin) {
          return;
        }

        let superAdminRoleService = strapi.service('admin::role');
        let superAdminRole = await superAdminRoleService?.getSuperAdmin();

        if (!superAdminRole) {
          strapi.log.warn("Superuser role doesn't exist on the server.. Creating super user");
          superAdminRole = await strapi.db.query("admin::role").create({
              data: {
                name: "Super Admin",
                code: "strapi-super-admin",
                description:
                  "Super Admins can access and manage all features and settings.",
              }
            });
        }
        if(strapi.service('admin::user'))
      {
        if( strapi.service('admin::user')?.create){
        const create = strapi.service('admin::user')?.create!;
        await create({
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
      }
      }
    
    
  } catch (error) {
    strapi.log.error(error)
  }
}






export default async(StrapiObject:any):Promise<void> => {
  
  const {strapi} = StrapiObject;
  const userServicePlugin =  strapi.plugins["users-permissions"]
  strapi.log.info("Attempting to start medusa plugin")
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
      const userPermissionsService = await userServicePlugin.services["users-permissions"];  
      try{
      await  userPermissionsService.initialize();
      
      const permissions = await userServicePlugin.services["users-permissions"].getActions(userServicePlugin)

      // eslint-disable-next-line guard-for-in
      for (const permission in permissions)
    {
      if(permissions[permission].controllers){
      enabledCrudOnModels(permissions[permission].controllers)}
  
    }
    await createMedusaRole(permissions)
    medusaRoleId = await hasMedusaRole()
  } catch (e) {
    strapi.log.error(chalk.yellowBright("Medusa plugin error "+(e as Error).message))
  }
    
}

strapi.log.info(("Medusa plugin successfully started"))
}
catch(e)
{
  strapi.log.error(("Medusa plugin error "+(e as Error).message))
}
  
};
