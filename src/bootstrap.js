"use strict"

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

async function hasSuperUser() {
  strapi.log.debug(`Checking if Superuser exists`)
  const superAdminRole = await strapi.service('admin::user').exists();
  return superAdminRole?true:false
}

async function createSuperUser() {
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
    
    
    /*
    // Create the strapi-super-admin role as it doesn’t exist on the first run, then it will create the super-admin user
    let verifyRole = await strapi
      .query("role", "admin")
      .findOne({ code: "strapi-super-admin" })
    if (!verifyRole) {
      verifyRole = await strapi.query("role", "admin").create({
        name: "Super Admin",
        code: "strapi-super-admin",
        description:
          "Super Admins can access and manage all features and settings.",
      })
    }

    params.roles = [verifyRole.id]
    params.password = await strapi.admin.services.auth.hashPassword(
      params.password
    )
    // Create admin account
    const admin = await strapi.query("user", "admin").create({ ...params })
    strapi.log.info("Superuser account created")*/
  } catch (error) {
    console.error(error)
  }
}

async function hasMedusaRole(strapi) {
  
  strapi.log.debug('Checking if "medusa" role exists')
  const roleStatusQuery = await strapi
    .query("plugin::users-permissions.role").findOne({ type: "medusa" })
    .then((result) => {
      if (!result) {
        strapi.log.warn('Role named "medusa" not found')
        return false
      } else if (result && result.id) {
        strapi.log.info('Found role named "medusa"')
        return result.id
      }
    })
    /*if(!result)
    {
      strapi.log.warn('Role named "medusa" not found')
      return false
    }
    strapi.log.info('Found role named "medusa"')
    return roleStatus.id*/
}

function enabledCrudOnModels(controllers) {
  Object.keys(controllers).forEach((key) => {
    console.log(`Enabling CRUD permission on model "${key}" for role "medusa"`)
    Object.keys(controllers[key]).forEach((action) => {
      controllers[key][action].enabled = true
    })
  })
}

async function createMedusaRole(permissions) {
  strapi.log.debug('Creating "Medusa" role')
  const role = {
    name: "Medusa",
    description: "Role for medusa plugin",
    permissions,
    users: [],
  }

  const roleCreation = await strapi.plugins[
    "users-permissions"
  ].services.role.createRole(role)
  if (roleCreation && roleCreation.length) {
    strapi.log.info('Role - "Medusa" created successfully')
    return roleCreation[0].role.id
  }
}

async function hasMedusaUser() {
  strapi.log.debug('Checking if "medusa_user" exists')
  const user = await strapi.query("plugin::users-permissions.user").findOne({
    username: "medusa_user",
  })
  if (user && user.id) {
    strapi.log.info('Found user with username "medusa_user"')
    return user.id
  } else {
    strapi.log.warn('User with username "medusa_user" not found')
    return false
  }
}

async function createMedusaUser(medusaRoleId) {
  const params = {
    username: process.env.MEDUSA_USER_USERNAME || "medusa_user",
    password: process.env.MEDUSA_USER_PASSWORD || "medusaPassword1",
    email: process.env.MEDUSA_USER_EMAIL || "medusa@medusa.com",
    role: medusaRoleId,
    confirmed: true,
    blocked: false,
    provider: "local",
  }

 const user = await strapi.plugins[
    "users-permissions"
  ].services.user.add(params)
  //const user = await strapi.query("plugin::users-permissions.user").add(params)
  if (user && user.id) {
    strapi.log.info(
      `User "medusa_user" created successfully with id ${user.id}`
    )
    return user.id
  } else {
    strapi.log.error('Failed to create user "medusa_user"')
    return false
  }
}

async function isFirstRun() {
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

module.exports = async ( strapi ) => {
  try {
    if (!(await hasSuperUser())) {
      await createSuperUser()
    } else {
      strapi.log.info("Found a Superuser account.")
    }

    let medusaRoleId = await hasMedusaRole(strapi)

    if (!medusaRoleId) {
      const plugins = await strapi.plugins[
        "users-permissions"
      ].services["users-permissions"].initialize();

      const permissions = await strapi.plugins[
        "users-permissions"
      ].services["users-permissions"].getActions(plugins)

      for (let permission in permissions)
    {
      enabledCrudOnModels(permissions[permission].controllers)}
      medusaRoleId = await createMedusaRole(permissions)
    }

    let medusaUserId = await hasMedusaUser()
    if (!medusaUserId) {
      medusaUserId = await createMedusaUser(medusaRoleId)
    }

    const firstRun = await isFirstRun()

    if (firstRun) {
      strapi.log.debug(
        "First run detected! Synchronizing database with Medusa. Please Wait..."
      )
     const syncMedusa = (await import("./sync.js")).default
        
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
  } catch (e) {
    console.log(e)
  }
}
