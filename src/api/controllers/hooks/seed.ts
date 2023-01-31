import {
    FulfillmentProviderService,
    PaymentProviderService,
    Product,
    ProductCollection,
    ProductCollectionService,
    Region,
    ShippingOption,
    ShippingOptionService,
    ShippingProfile,
    ShippingProfileService,
    StoreService
} from "@medusajs/medusa";
import { ProductCollectionRepository } from "@medusajs/medusa/dist/repositories/product-collection";
import { RegionRepository } from "@medusajs/medusa/dist/repositories/region";
import { ShippingOptionRepository } from "@medusajs/medusa/dist/repositories/shipping-option";
import { ShippingProfileRepository } from "@medusajs/medusa/dist/repositories/shipping-profile";
import _ from "lodash";
import { EntityManager, ObjectType, Repository } from "typeorm";
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

        const productCollectionRepository = req.scope.resolve(
            "productCollectionRepository"
        );

        const allProductsCount = await productService.count();
        const allProductCollectionCount = await getCount(
            manager,
            productCollectionRepository
        );
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
        const productCollectionService = req.scope.resolve(
            "productCollectionService"
        ) as ProductCollectionService;

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

        const productCollectionFields: (keyof ProductCollection)[] = [
            "title",
            "handle"
        ];

        const productCollectionRelations = ["products"];
        // Fetching all entries at once. Can be optimized
        const productCollectionListConfig = {
            skip: 0,
            take: allProductCollectionCount,
            select: productCollectionFields,
            relations: productCollectionRelations
        };

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

        const allProductCollections = (await productCollectionService.list(
            {},
            productCollectionListConfig
        )) as StrapiEntity[];

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

        const response: Record<string, StrapiEntity[]> = {
            productCollections: allProductCollections,
            products: allProducts,
            regions: allRegions,
            paymentProviders: allPaymentProviders,
            fulfillmentProviders: allFulfillmentProviders,
            shippingOptions: allShippingOptions,
            shippingProfiles: allShippingProfiles
        };

        translateIdsToMedusaIds(response);

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
): void {
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
            break;
        }
    }
}

// eslint-disable-next-line valid-jsdoc
/**
 * Return total number of entries for a repository
 * @return {*}
 */
async function getCount(manager: EntityManager, repository: ObjectType<any>) {
    const customRepository = manager.getCustomRepository(repository) as any;
    return customRepository.count ? await customRepository.count() : 0;
}
