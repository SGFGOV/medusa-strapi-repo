export default async (req, res) => {
  try {
    const manager = req.scope.resolve("manager");
    const productService = req.scope.resolve("productService");
    const regionService = req.scope.resolve("regionService");
    const paymentProviderService = req.scope.resolve("paymentProviderService");
    const fulfillmentProviderService = req.scope.resolve(
        "fulfillmentProviderService",
    );
    const shippingProfileService = req.scope.resolve("shippingProfileService");
    const shippingOptionService = req.scope.resolve("shippingOptionService");
    const regionRepository = req.scope.resolve("regionRepository");
    const shippingProfileRepository = req.scope.resolve(
        "shippingProfileRepository",
    );
    const shippingOptionRepository = req.scope.resolve(
        "shippingOptionRepository",
    );
    const allProductsCount = await productService.count();
    const allRegionCount = await getCount(manager, regionRepository);
    const allShippingProfileCount = await getCount(
        manager,
        shippingProfileRepository,
    );
    const allShippingOptionCount = await getCount(
        manager,
        shippingOptionRepository,
    );

    const productFields = [
      "id",
      "title",
      "subtitle",
      "description",
      "handle",
      "is_giftcard",
      "discountable",
      "thumbnail",
      "weight",
      "length",
      "height",
      "width",
      "hs_code",
      "origin_country",
      "mid_code",
      "material",
      "metadata",
    ];
    const regionFields = ["id", "name", "tax_rate", "tax_code", "metadata"];
    const shippingProfileFields = ["id", "name", "type", "metadata"];
    const shippingOptionFields = [
      "id",
      "name",
      "price_type",
      "amount",
      "is_return",
      "admin_only",
      "data",
      "metadata",
    ];

    const productRelations = [
      "variants",
      "variants.prices",
      "variants.options",
      "images",
      "options",
      "tags",
      "type",
      "collection",
      "profile",
    ];
    const regionRelations = [
      "countries",
      "payment_providers",
      "fulfillment_providers",
      "currency",
    ];
    const shippingProfileRelations = [
      "products",
      "shipping_options",
      "shipping_options.profile",
      "shipping_options.requirements",
      "shipping_options.provider",
      "shipping_options.region",
      "shipping_options.region.countries",
      "shipping_options.region.payment_providers",
      "shipping_options.region.fulfillment_providers",
      "shipping_options.region.currency",
    ];
    const shippingOptionRelations = [
      "region",
      "region.countries",
      "region.payment_providers",
      "region.fulfillment_providers",
      "region.currency",
      "profile",
      "profile.products",
      "profile.shipping_options",
      "requirements",
      "provider",
    ];

    // Fetching all entries at once. Can be optimized
    const productListConfig = {
      skip: 0,
      take: allProductsCount,
      select: productFields,
      relations: productRelations,
    };
    const regionListConfig = {
      skip: 0,
      take: allRegionCount,
      select: regionFields,
      relations: regionRelations,
    };
    const shippingOptionsConfig = {
      skip: 0,
      take: allShippingOptionCount,
      select: shippingOptionFields,
      relations: shippingOptionRelations,
    };
    const shippingProfileConfig = {
      skip: 0,
      take: allShippingProfileCount,
      select: shippingProfileFields,
      relations: shippingProfileRelations,
    };

    const allRegions = await regionService.list({}, regionListConfig);
    const allProducts = await productService.list({}, productListConfig);
    const allPaymentProviders = await paymentProviderService.list();
    const allFulfillmentProviders = await fulfillmentProviderService.list();
    const allShippingOptions = await shippingOptionService.list(
        {},
        shippingOptionsConfig,
    );
    const allShippingProfiles = await shippingProfileService.list(
        {},
        shippingProfileConfig,
    );

    const response = {
      products: allProducts,
      regions: allRegions,
      paymentProviders: allPaymentProviders,
      fulfillmentProviders: allFulfillmentProviders,
      shippingOptions: allShippingOptions,
      shippingProfiles: allShippingProfiles,
    };

    res.status(200).send(response);
  } catch (error) {
    res.status(400).send(`Webhook error: ${error.message}`);
  }
};

// eslint-disable-next-line valid-jsdoc
/**
 * Return total number of entries for a repository
 * @return {*}
 */
function getCount(manager, repository) {
  const customRepository = manager.getCustomRepository(repository);
  return customRepository.count();
}
