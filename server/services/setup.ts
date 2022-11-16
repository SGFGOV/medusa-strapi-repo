import { Strapi } from "@strapi/strapi";
import {default as axios} from "axios"
import _ from "lodash";
import * as jwt from "jsonwebtoken"

let strapi;

export function config(myStrapi:Strapi):void
{
  strapi = myStrapi
}

export async function hasMedusaRole():Promise<number|boolean> {
  
  strapi.log.debug('Checking if "Medusa" role exists')
  try{
  const result =  await strapi
    .query("plugin::users-permissions.role").findOne({ type: "Medusa" }) /** all users created via medusa will be medusas */
     strapi.log.info('Found role named Medusa')
        return result.id
  }
  catch(e)
  {
    strapi.log.error('Not Found role named Medusa')
    return false;
  }
}

export function enabledCrudOnModels(controllers): void {
  
  Object.keys(controllers).forEach((key) => {
    strapi.logger.info(`Enabling CRUD permission on model "${key}" for role "Medusa"`)
    Object.keys(controllers[key]).forEach((action) => {
      controllers[key][action].enabled = true
    })
  })
}

export async function createMedusaRole(permissions):Promise<number> {
  strapi.log.debug('Creating "Medusa" role')
  const role= {
    name: "Medusa",
    description: "reusing medusa role",
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

export async function hasMedusaUser(strapi):Promise<number|boolean>  {
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


export async function deleteAllEntries():Promise<void> {
  const plugins = await strapi.plugins[
    "users-permissions"
  ].services["users-permissions"].initialize();

  const permissions = await strapi.plugins[
    "users-permissions"
  ].services["users-permissions"].getActions(plugins)

//  const controllers = permissions[permission].controllers
  // flush only apis
  const apisToFlush = Object.keys(permissions).filter(value=>{return value.startsWith("api::")!=false})
  for (const key of apisToFlush) {
    const controllers = permissions[key].controllers
    for (const controller of Object.keys(controllers)){ 
    const queryKey = `${key}.${controller}`
    const count = await strapi.query(queryKey).count()
    try {
    await strapi.query(queryKey).delete({
      _limit: count,  
      
    })
  }catch(error)

  {
    strapi.log.info("unable to flush entity "+queryKey,JSON.stringify(error))
  }
  }
  }
  strapi.log.info("All existing entries deleted")
}

export interface medusaUserId{
  username: string;
  password: string,
  email: string,
  confirmed: boolean,
  blocked: boolean,
  provider: string,
}





export async function createMedusaUser(medusaUser:medusaUserId):Promise<any> {
 

let medusaRole;
try {
  medusaRole = await hasMedusaRole();  
} catch (error) {
  strapi.logger.error("medusa role doesn't exist",
  (error as Error).message)  
}

const params = _.cloneDeep (medusaUser);
params["role"] = medusaRole;
try{

const user = await strapi.plugins["users-permissions"].services.user.add(params)
if (user && user.id) {
  strapi.log.info(
    `User ${params.username} ${params.email} created successfully with id ${user.id}`
  )
  return user
} else {
  strapi.log.error(`Failed to create user  ${params.username} ${params.email} `)
  return false
}
}catch (error)
{
  strapi.log.error((error as Error).message);
  return false
}
}

export interface strapiSignal {

  message:string;
  code:number;
  data:any;

}

export async function sendSignalToMedusa(message:string="Ok",code:number=200,data?:any)
{
  const medusaServer = `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}`
  const strapiSignalHook =  `${medusaServer}/hooks/strapi-signal`
  let medusaReady = false;
  const messageData = {
    message,
    code,
    data
  }
  while(!medusaReady)
    {
        const response = await axios.head(`${medusaServer}/health`)
        medusaReady =  response.status< 300 ? true:false;
    }
  try{
    const signedMessage = jwt.sign(messageData,process.env.MEDUSA_STRAPI_SECRET||"no-secret")
    return await axios.post(strapiSignalHook,{signedMessage:signedMessage})
  }
  catch(error)
  {
    strapi.log.error("unable to send message to medusa server")
  }

}

export  async function synchroniseWithMedusa({ strapi }): Promise<any> {
  try {
    // return;
    const medusaServer = `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}`
    const medusaSeedHookUrl =  `${medusaServer}/hooks/seed`
    

    let medusaReady = false;
    while(!medusaReady)
    {
        const response = await axios.head(`${medusaServer}/health`)
        medusaReady =  response.status< 300 ? true:false;
    } 

    strapi.log.info("attempting to sync connect with medusa server on ",medusaSeedHookUrl)
    const seedData = await axios.post(
      medusaSeedHookUrl,
      {},
      {}
    )
   

    // IMPORTANT: Order of seed must be maintained. Please don't change the order
    const products = seedData.data.products
    const regions = seedData.data.regions
    const shippingOptions = seedData.data.shippingOptions
    const paymentProviders = seedData.data.paymentProviders
    const fulfillmentProviders = seedData.data.fulfillmentProviders
    const shippingProfiles = seedData.data.shippingProfiles
    //const stores = seedData.data.stores

    await strapi.services["api::fulfillment-provider.fulfillment-provider"].bootstrap(
      fulfillmentProviders
    )
    await strapi.services["api::payment-provider.payment-provider"].bootstrap(paymentProviders)
    await strapi.services["api::region.region"].bootstrap(regions)
    await strapi.services["api::shipping-option.shipping-option"].bootstrap(shippingOptions)
    await strapi.services["api::shipping-profile.shipping-profile"].bootstrap(shippingProfiles)
    await strapi.services["api::product.product"].bootstrap(products)
    //await strapi.services["api::store.store"].bootstrap(stores)

    strapi.log.info("SYNC FINISHED")
    const result  =  (await sendSignalToMedusa("SYNC COMPLETED")).status == 200
    return result
  } catch (e) {
    // console.log(e);
     
      strapi.log.info(
        "Unable to connect to Medusa server. Please make sure Medusa server is up and running",
        JSON.stringify(e)
      )
     // process.exit(1)
    
  }
}

const setup={
  createMedusaUser,
  synchroniseWithMedusa,
  deleteAllEntries,
  hasMedusaRole,
  hasMedusaUser
}

export default setup 