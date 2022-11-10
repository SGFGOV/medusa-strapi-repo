export default async (req, res) => {
  try {
    const body = req.body
    const updateMedusaService = req.scope.resolve("updateMedusaService")

    // find Strapi entry type from body of webhook
    const strapiType = body.type
    // get the ID
    let entryId

    let updated = {}
    switch (strapiType) {
      case "product":
        entryId = body.data.medusa_id
        updated = await updateMedusaService.sendStrapiProductToMedusa(
          body.data,
          entryId
        )
        break
      case "productVariant":
        entryId = body.data.medusa_id
        updated = await updateMedusaService.sendStrapiProductVariantToMedusa(
          body.data,
          entryId
        )
        break
      case "region":
        console.log("region")
        entryId = body.data.medusa_id
        updated = await updateMedusaService.sendStrapiRegionToMedusa(
          body.data,
          entryId
        )
        break
      default:
        break
    }

    res.status(200).send(updated)
  } catch (error) {
    res.status(400).send(`Webhook error: ${error.message}`)
  }
}
