const axios = require("axios")

async function deleteAllEntries() {
  const plugins = await strapi.plugins[
    "users-permissions"
  ].services.userspermissions.getPlugins("en")

  const permissions = await strapi.plugins[
    "users-permissions"
  ].services.userspermissions.getActions(plugins)

  // Fetch all models name
  const controllers = permissions.application.controllers

  for (const key of Object.keys(controllers)) {
    const count = await strapi.query(key, "").count()
    await strapi.query(key, "").delete({
      _limit: count,
    })
  }
  strapi.log.info("All existing entries deleted")
}

module.exports = async ({ strapi }) => {
  try {
    // return;
    await deleteAllEntries()
    let seedData = await axios.post(
      `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/hooks/seed`,
      {},
      {}
    )
    seedData = seedData.data

    // IMPORTANT: Order of seed must be maintained. Please don't change the order
    const products = seedData.products
    const regions = seedData.regions
    const shippingOptions = seedData.shippingOptions
    const paymentProviders = seedData.paymentProviders
    const fulfillmentProviders = seedData.fulfillmentProviders
    const shippingProfiles = seedData.shippingProfiles

    await strapi.services["fulfillment-provider"].bootstrap(
      fulfillmentProviders
    )
    await strapi.services["payment-provider"].bootstrap(paymentProviders)
    await strapi.services["region"].bootstrap(regions)
    await strapi.services["shipping-option"].bootstrap(shippingOptions)
    await strapi.services["shipping-profile"].bootstrap(shippingProfiles)
    await strapi.services["product"].bootstrap(products)

    strapi.log.info("SYNC FINISHED")

    return true
  } catch (e) {
    // console.log(e);
    if (e.code === "ECONNREFUSED") {
      strapi.log.fatal(
        "Unable to connect to Medusa server. Please make sure Medusa server is up and running"
      )
      process.exit(1)
    }
  }
}
