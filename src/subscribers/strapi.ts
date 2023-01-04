import {
    EventBusService,
    ProductService,
    ProductVariantService,
    User
} from "@medusajs/medusa";
import { Logger } from "@medusajs/medusa/dist/types/global";

import { AuthInterface } from "types/globals";
import UpdateStrapiService from "../services/update-strapi";

class StrapiSubscriber {
    productVariantService_: ProductVariantService;
    productService_: ProductService;
    strapiService_: UpdateStrapiService;
    eventBus_: EventBusService;
    loggedInUserAuth: AuthInterface;
    logger: Logger;

    constructor({
        updateStrapiService,
        productVariantService,
        productService,
        eventBusService,
        logger
    }) {
        this.productVariantService_ = productVariantService;
        this.productService_ = productService;
        this.strapiService_ = updateStrapiService;
        this.eventBus_ = eventBusService;
        this.logger = logger;
        this.logger.info("Strapi Subscriber Initialized");

        this.eventBus_.subscribe(
            "region.created",
            async (data: { id: string }) => {
                const authInterace: AuthInterface =
                    (await this.getLoggedInUserStrapiCreds()) ??
                    this.strapiService_.defaultAuthInterface;
                await this.strapiService_.createRegionInStrapi(
                    data.id,
                    authInterace
                );
            }
        );

        this.eventBus_.subscribe("region.updated", async (data) => {
            await this.strapiService_.updateRegionInStrapi(data);
        });

        this.eventBus_.subscribe(
            "product-variant.created",
            async (data: { id: string }) => {
                const authInterace: AuthInterface =
                    (await this.getLoggedInUserStrapiCreds()) ??
                    this.strapiService_.defaultAuthInterface;
                await this.strapiService_.createProductVariantInStrapi(
                    data.id,
                    authInterace
                );
            }
        );

        this.eventBus_.subscribe("product-variant.updated", async (data) => {
            const authInterace: AuthInterface =
                (await this.getLoggedInUserStrapiCreds()) ??
                this.strapiService_.defaultAuthInterface;
            await this.strapiService_.updateProductVariantInStrapi(
                data,
                authInterace
            );
        });

        this.eventBus_.subscribe("product.updated", async (data) => {
            const authInterace: AuthInterface =
                (await this.getLoggedInUserStrapiCreds()) ??
                this.strapiService_.defaultAuthInterface;
            await this.strapiService_.updateProductInStrapi(data);
        });

        this.eventBus_.subscribe(
            "product.created",
            async (data: { id: string }) => {
                const authInterace: AuthInterface =
                    (await this.getLoggedInUserStrapiCreds()) ??
                    this.strapiService_.defaultAuthInterface;
                await this.strapiService_.createProductInStrapi(
                    data.id,
                    authInterace
                );
            }
        );

        this.eventBus_.subscribe("product.deleted", async (data) => {
            const authInterace: AuthInterface =
                (await this.getLoggedInUserStrapiCreds()) ??
                this.strapiService_.defaultAuthInterface;
            await this.strapiService_.deleteProductInStrapi(data, authInterace);
        });

        this.eventBus_.subscribe("product-variant.deleted", async (data) => {
            const authInterace: AuthInterface =
                (await this.getLoggedInUserStrapiCreds()) ??
                this.strapiService_.defaultAuthInterface;
            await this.strapiService_.deleteProductVariantInStrapi(
                data,
                authInterace
            );
        });

        // Blocker - Delete Region API
        this.eventBus_.subscribe("region.deleted", async (data) => {
            const authInterace: AuthInterface =
                (await this.getLoggedInUserStrapiCreds()) ??
                this.strapiService_.defaultAuthInterface;
            await this.strapiService_.deleteRegionInStrapi(data, authInterace);
        });
    }
    async getLoggedInUserStrapiCreds(): Promise<AuthInterface> {
        return this.loggedInUserAuth;
    }

    setLoggedInUserCreds(email, password): void {
        this.loggedInUserAuth = {
            email,
            password
        };
    }
}

export default StrapiSubscriber;
