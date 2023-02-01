import {
    FulfillmentProviderService,
    PaymentProviderService,
    Product,
    ProductCollection,
    ProductCollectionService,
    ProductService,
    Region,
    RegionService,
    ShippingOption,
    ShippingOptionService,
    ShippingProfile,
    ShippingProfileService,
    StoreService
} from "@medusajs/medusa";
import { ProductCollectionRepository } from "@medusajs/medusa/dist/repositories/product-collection";
import { ShippingOptionRepository } from "@medusajs/medusa/dist/repositories/shipping-option";
import { ShippingProfileRepository } from "@medusajs/medusa/dist/repositories/shipping-profile";
import { NextFunction, Request, Response } from "express";
import { boolean, number, string } from "joi";
import _ from "lodash";
import { EntityManager, ObjectType } from "typeorm";
import { StrapiEntity } from "../../../services/update-strapi";
import { StrapiSignalInterface } from "./strapi-signal";

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pageLimit = 50;
        const manager = req.scope.resolve("manager") as EntityManager;
        const productService = req.scope.resolve(
            "productService"
        ) as ProductService;
        const regionService = req.scope.resolve(
            "regionService"
        ) as RegionService;
        const pageNumber =
            (req.body as StrapiSignalInterface).data?.pageNumber ?? 1;
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
        /* const regionRepository = req.scope.resolve("regionRepository");
        const shippingProfileRepository = req.scope.resolve(
            "shippingProfileRepository"
        ) as typeof ShippingProfileRepository;
        const shippingOptionRepository = req.scope.resolve(
            "shippingOptionRepository"
        ) as typeof ShippingOptionRepository;

        const productCollectionRepository = req.scope.resolve(
            "productCollectionRepository"
        ) as typeof ProductCollectionRepository;

        // const allProductsCount = await productService.count();
        /* onst allProductCollectionCount = await getCount(
            manager,
            productCollectionRepository
        );*/
        // const allRegionCount = await getCount(manager, regionRepository);
        /* const allShippingProfileCount = await getCount(
            manager,
            shippingProfileRepository
        );*/
        /* const allShippingOptionCount = await getCount(
            manager,
            shippingOptionRepository
        );*/

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
            // "products", /** disabling for now, as its been removed from strapi relations, bootstrap takes too long */
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
            "id",
            "title",
            "handle"
        ];

        const productCollectionRelations = ["products"];
        // Fetching all entries at once. Can be optimized
        const productCollectionListConfig = {
            skip: (pageNumber - 1) * pageLimit,
            take: pageLimit,
            select: productCollectionFields,
            relations: productCollectionRelations
        };

        const productListConfig = {
            skip: (pageNumber - 1) * pageLimit,
            take: pageLimit,
            select: productFields,
            relations: productRelations
        };
        const regionListConfig = {
            skip: (pageNumber - 1) * pageLimit,
            take: pageLimit,
            select: regionFields,
            relations: regionRelations
        };
        const shippingOptionsConfig = {
            skip: (pageNumber - 1) * pageLimit,
            take: pageLimit,
            select: shippingOptionFields,
            relations: shippingOptionRelations
        };
        const shippingProfileConfig = {
            skip: (pageNumber - 1) * pageLimit,
            take: pageLimit,
            select: shippingProfileFields,
            relations: shippingProfileRelations
        };

        const pagedProductCollections = (await productCollectionService.list(
            {},
            productCollectionListConfig
        )) as StrapiEntity[];

        const pagedRegions = (await regionService.list(
            {},
            regionListConfig
        )) as StrapiEntity[];
        const pagedProducts = (await productService.list(
            {},
            productListConfig
        )) as StrapiEntity[];
        const pagedPaymentProviders = await paymentProviderService.list();
        const pagedFulfillmentProviders =
            await fulfillmentProviderService.list();
        const pagedShippingOptions = await shippingOptionService.list(
            {},
            shippingOptionsConfig
        );
        const pagedShippingProfiles = await shippingProfileService.list(
            {},
            shippingProfileConfig
        );

        const response: Record<string, StrapiEntity[]> = {
            productCollections: pagedProductCollections,
            products: pagedProducts,
            regions: pagedRegions,
            paymentProviders: pagedPaymentProviders as any,
            fulfillmentProviders: pagedFulfillmentProviders as any,
            shippingOptions: pagedShippingOptions,
            shippingProfiles: pagedShippingProfiles
        };

        translateIdsToMedusaIds(response);
        const seedResponse: StrapiSeedInterface = {
            meta: {
                pageNumber,
                pageLimit,
                hasMore: {
                    productCollections:
                        pagedProductCollections.length == pageLimit,
                    products: pagedProducts.length == pageLimit,
                    regions: pagedRegions.length == pageLimit,
                    paymentProviders: pagedPaymentProviders.length == pageLimit,
                    fulfillmentProviders:
                        pagedFulfillmentProviders.length == pageLimit,
                    shippingOptions: pagedShippingOptions.length == pageLimit,
                    shippingProfiles: pagedShippingProfiles.length == pageLimit
                }
            },
            data: response
        };

        res.status(200).send(seedResponse);
    } catch (error) {
        res.status(400).send(`Webhook error: ${error.message}`);
    }
};

export type StrapiSeedType =
    | Record<string, StrapiEntity[]>
    | Record<string, StrapiEntity>
    | StrapiEntity;

export interface StrapiSeedInterface {
    meta: {
        pageNumber: number;
        pageLimit: number;
        hasMore: Record<string, boolean>;
    };
    data: StrapiSeedType;
}
export function translateIdsToMedusaIds(
    dataToSend: StrapiSeedType
):
    | Record<string, StrapiEntity[]>
    | Record<string, StrapiEntity>
    | StrapiEntity {
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
async function getCount(manager: EntityManager, repository: ObjectType<any>) {
    const customRepository = manager.getCustomRepository(repository) as any;
    return customRepository.count ? await customRepository.count() : 0;
}
