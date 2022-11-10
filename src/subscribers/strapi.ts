class StrapiSubscriber {
  constructor({
    updateStrapiService,
    productVariantService,
    productService,
    eventBusService,
  }) {
    this.productVariantService_ = productVariantService
    this.productService_ = productService
    this.strapiService_ = updateStrapiService
    this.eventBus_ = eventBusService
    console.warn("\n Strapi Subscriber Initialized")

    this.eventBus_.subscribe("region.created", async (data) => {
      await this.strapiService_.createRegionInStrapi(data.id)
    })

    this.eventBus_.subscribe("region.updated", async (data) => {
      await this.strapiService_.updateRegionInStrapi(data)
    })

    this.eventBus_.subscribe("product-variant.created", async (data) => {
      await this.strapiService_.createProductVariantInStrapi(data.id)
    })

    this.eventBus_.subscribe("product-variant.updated", async (data) => {
      await this.strapiService_.updateProductVariantInStrapi(data)
    })

    this.eventBus_.subscribe("product.updated", async (data) => {
      await this.strapiService_.updateProductInStrapi(data)
    })

    this.eventBus_.subscribe("product.created", async (data) => {
      await this.strapiService_.createProductInStrapi(data.id)
    })

    this.eventBus_.subscribe("product.deleted", async (data) => {
      await this.strapiService_.deleteProductInStrapi(data)
    })

    this.eventBus_.subscribe("product-variant.deleted", async (data) => {
      await this.strapiService_.deleteProductVariantInStrapi(data)
    })

    // Blocker - Delete Region API
    this.eventBus_.subscribe("region.deleted", async (data) => {
      await this.strapiService_.deleteRegionInStrapi(data)
    })
  }
}

export default StrapiSubscriber
