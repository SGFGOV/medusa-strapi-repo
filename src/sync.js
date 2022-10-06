const axios = require("axios")

async function deleteAllEntries() {
  const plugins = await strapi.plugins[
    "users-permissions"
  ].services["users-permissions"].initialize();

  const permissions = await strapi.plugins[
    "users-permissions"
  ].services["users-permissions"].getActions(plugins)

//  const controllers = permissions[permission].controllers
  //flush only apis
  const apisToFlush = Object.keys(permissions).filter(value=>{return value.startsWith("api::")!=false})
  for (let key of apisToFlush) {
    const controllers = permissions[key].controllers
    for (let controller of Object.keys(controllers)){ 
    const queryKey = `${key}.${controller}`
    const count = await strapi.query(queryKey, "").count()
    try {
    await strapi.query(queryKey, "").delete({
      _limit: count,  
      
    })
  }catch(error)

  {
    strapi.log.info("unable to flush entity "+queryKey)
  }
  }
  }
  strapi.log.info("All existing entries deleted")


}
module.exports = async ({ strapi }) => {
  try {
    // return;
    await deleteAllEntries() 
    const medusaServerUrl =  `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/hooks/seed`
    strapi.log.info("attempting to connect with medusa server on ",medusaServerUrl)
    let seedData = await axios.post(
      medusaServerUrl,
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

    await strapi.services["api::fulfillment-provider.fulfillment-provider"].bootstrap(
      fulfillmentProviders
    )
    await strapi.services["api::payment-provider.payment-provider"].bootstrap(paymentProviders)
    await strapi.services["api::region.region"].bootstrap(regions)
    await strapi.services["api::shipping-option.shipping-option"].bootstrap(shippingOptions)
    await strapi.services["api::shipping-profile.shipping-profile"].bootstrap(shippingProfiles)
    await strapi.services["api::product.product"].bootstrap(products)

    strapi.log.info("SYNC FINISHED")

    return true
  } catch (e) {
    // console.log(e);
     
      strapi.log.info(
        "Unable to connect to Medusa server. Please make sure Medusa server is up and running",
        JSON.stringify(e)
      )
      process.exit(1)
    
  }
}
