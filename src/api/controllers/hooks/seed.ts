import {
    FulfillmentProviderService,
    PaymentProviderService,
    Product,
    Region,
    ShippingOption,
    ShippingOptionService,
    ShippingProfile,
    ShippingProfileService,
    StoreService
} from "@medusajs/medusa";
import _ from "lodash";
import { StrapiEntity } from "../../../services/update-strapi";

export default async (req, res, next) => {
    try {
        const manager = req.scope.resolve("manager");
        const productService = req.scope.resolve("productService");
        const regionService = req.scope.resolve("regionService");
        const paymentProviderService = req.scope.resolve(
            "paymentProviderService"
        ) as PaymentProviderService;
        const fulfillmentProviderService = req.scope.resolve(
            "fulfillmentProviderService"
        ) as FulfillmentProviderService;
        const shippingProfileService = req.scope.resolve(
            "shippingProfileService"
        ) as ShippingProfileService;
        const shippingOptionService = req.scope.resolve(
            "shippingOptionService"
        ) as ShippingOptionService;
        const regionRepository = req.scope.resolve("regionRepository");
        const shippingProfileRepository = req.scope.resolve(
            "shippingProfileRepository"
        );
        const shippingOptionRepository = req.scope.resolve(
            "shippingOptionRepository"
        );
        const allProductsCount = await productService.count();
        const allRegionCount = await getCount(manager, regionRepository);
        const allShippingProfileCount = await getCount(
            manager,
            shippingProfileRepository
        );
        const allShippingOptionCount = await getCount(
            manager,
            shippingOptionRepository
        );

        const storeService = req.scope.resolve("storeService") as StoreService;

        const productFields: (keyof Product)[] = [
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
            "metadata"
        ];
        const regionFields: (keyof Region)[] = [
            "id",
            "name",
            "tax_rate",
            "tax_code",
            "metadata"
        ];
        const shippingProfileFields: (keyof ShippingProfile)[] = [
            "id",
            "name",
            "type",
            "metadata"
        ];
        const shippingOptionFields: (keyof ShippingOption)[] = [
            "id",
            "name",
            "price_type",
            "amount",
            "is_return",
            "admin_only",
            "data",
            "metadata"
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
            "profile"
        ];
        const regionRelations = [
            "countries",
            "payment_providers",
            "fulfillment_providers",
            "currency"
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
            "shipping_options.region.currency"
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
            "provider"
        ];

        // Fetching all entries at once. Can be optimized
        const productListConfig = {
            skip: 0,
            take: allProductsCount,
            select: productFields,
            relations: productRelations
        };
        const regionListConfig = {
            skip: 0,
            take: allRegionCount,
            select: regionFields,
            relations: regionRelations
        };
        const shippingOptionsConfig = {
            skip: 0,
            take: allShippingOptionCount,
            select: shippingOptionFields,
            relations: shippingOptionRelations
        };
        const shippingProfileConfig = {
            skip: 0,
            take: allShippingProfileCount,
            select: shippingProfileFields,
            relations: shippingProfileRelations
        };

        const allRegions = (await regionService.list(
            {},
            regionListConfig
        )) as StrapiEntity[];
        const allProducts = (await productService.list(
            {},
            productListConfig
        )) as StrapiEntity[];
        const allPaymentProviders = (await paymentProviderService.list()) as [];
        const allFulfillmentProviders =
            (await fulfillmentProviderService.list()) as [];
        const allShippingOptions = (await shippingOptionService.list(
            {},
            shippingOptionsConfig
        )) as StrapiEntity[];
        const allShippingProfiles = (await shippingProfileService.list(
            {},
            shippingProfileConfig
        )) as StrapiEntity[];

        let response: Record<string, StrapiEntity[]> = {
            products: allProducts,
            regions: allRegions,
            paymentProviders: allPaymentProviders,
            fulfillmentProviders: allFulfillmentProviders,
            shippingOptions: allShippingOptions,
            shippingProfiles: allShippingProfiles
        };

        response = translateIdsToMedusaIds(response);

        res.status(200).send(response);
    } catch (error) {
        res.status(400).send(`Webhook error: ${error.message}`);
    }
};

function translateIdsToMedusaIds(
    dataToSend:
        | Record<string, StrapiEntity[]>
        | Record<string, StrapiEntity>
        | StrapiEntity
): Record<string, StrapiEntity[]> {
    const keys = Object.keys(dataToSend);
    for (const key of keys) {
        if (_.isArray(dataToSend[key])) {
            for (const element of dataToSend[key]) {
                translateIdsToMedusaIds(element);
            }
        } else if (dataToSend[key] instanceof Object) {
            translateIdsToMedusaIds(dataToSend[key]);
        } else if (key == "id") {
            dataToSend["medusa_id"] = dataToSend[key];
            delete dataToSend[key];
        }
    }
    return dataToSend;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Return total number of entries for a repository
 * @return {*}
 */
function getCount(manager, repository) {
    const customRepository = manager.getCustomRepository(repository);
    return customRepository.count();
}
