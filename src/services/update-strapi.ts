import { BaseService } from "medusa-interfaces";
import axios, { AxiosResponse, Method } from "axios";
import crypto = require("crypto");
import { Logger } from "@medusajs/medusa/dist/types/global";
import { sleep } from "@medusajs/medusa/dist/utils/sleep";
import {
    AuthService,
    BaseEntity,
    EventBusService,
    ProductService,
    ProductType,
    ProductTypeService,
    ProductVariantService,
    RegionService,
    TransactionBaseService
} from "@medusajs/medusa";
import { Service } from "medusa-extender";
import role from "@strapi/plugin-users-permissions/server/content-types/role/index";
import {
    StrapiMedusaPluginOptions,
    Tokens,
    StrapiSendParams,
    MedusaUserType,
    AdminUserType,
    AuthInterface,
    CreateInStrapiParams,
    GetFromStrapiParams,
    userCreds as UserCreds
} from "../types/globals";
import { EntityManager } from "typeorm";
import { FindConfig } from "@medusajs/medusa/dist/types/common";
import _ from "lodash";
import { setMaxIdleHTTPParsers } from "http";

const IGNORE_THRESHOLD = 3; // seconds

@Service({ scope: "SINGLETON" })
class UpdateStrapiService extends BaseService {
    static lastHealthCheckTime = 0;
    productService_: ProductService;
    productVariantService_: ProductVariantService;
    productTypeService_: ProductTypeService;
    regionService_: RegionService;
    eventBus_: EventBusService;
    algorithm: string;
    options_: StrapiMedusaPluginOptions;
    protocol: string;
    strapi_url: string;
    encryption_key: any;
    userTokens: Tokens;
    // strapiDefaultMedusaUserAuthToken: string;
    redis_: any;
    key: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>;
    iv: any;
    defaultAuthInterface: AuthInterface;
    strapiAdminAuthToken: string;
    defaultUserEmail: string;
    defaultUserPassword: string;
    userAdminProfile: any;
    logger: Logger;
    static isHealthy: boolean;
    strapiDefaultUserId: any;
    isStarted: boolean;

    constructor(
        {
            regionService,
            productService,
            redisClient,
            productVariantService,
            productTypeService,
            eventBusService,
            logger
        },
        options: StrapiMedusaPluginOptions
    ) {
        super();

        this.logger = logger ?? console;
        this.productService_ = productService;
        this.productVariantService_ = productVariantService;
        this.productTypeService_ = productTypeService;
        this.regionService_ = regionService;
        this.eventBus_ = eventBusService;

        this.options_ = options;
        this.algorithm = this.options_.encryption_algorithm || "aes-256-cbc"; // Using AES encryption
        this.iv = crypto.randomBytes(16);
        this.protocol = this.options_.strapi_protocol;
        this.strapi_url = `${this.protocol ?? "https"}://${
            this.options_.strapi_host ?? "localhost"
        }:${this.options_.strapi_port ?? 1337}`;
        this.encryption_key =
            this.options_.strapi_secret || this.options_.strapi_public_key;
        UpdateStrapiService.isHealthy = false;
        this.defaultUserEmail = options.strapi_default_user.email;
        this.defaultUserPassword = options.strapi_default_user.password;
        this.defaultAuthInterface = {
            email: this.defaultUserEmail,
            password: this.defaultUserPassword
        };
        this.userTokens = {};
        this.executeStrapiHealthCheck().then(async (res) => {
            if (res) {
                UpdateStrapiService.isHealthy = res;
                let startupStatus;
                try {
                    const startUpResult = await this.startInterface();
                    startupStatus = startUpResult.status < 300;
                } catch (error) {
                    this.logger.error(error.message);
                }

                if (!startupStatus) {
                    throw new Error("strapi startup error");
                }
            }
        });

        // attaching the default user
        this.redis_ = redisClient;
    }

    withTransaction(transactionManager?: EntityManager): BaseService {
        if (!transactionManager) {
            return this;
        }

        const clone = _.cloneDeep(this);
        clone.manager_ = transactionManager;
        this.transactionManager_ = transactionManager;
        return clone;
    }

    async startInterface(): Promise<any> {
        try {
            const result = await this.intializeServer();
            this.logger.info("Successfully Bootstrapped the strapi server");
            return result;
        } catch (e) {
            this.logger.error(`Unable to  bootstrap the strapi server, 
        please check configuration , ${e}`);
            throw e;
        }
    }

    async addIgnore_(id, side): Promise<any> {
        const key = `${id}_ignore_${side}`;
        return await this.redis_.set(
            key,
            1,
            "EX",
            this.options_.strapi_ignore_threshold || IGNORE_THRESHOLD
        );
    }

    async shouldIgnore_(id, side): Promise<any> {
        const key = `${id}_ignore_${side}`;
        return await this.redis_.get(key);
    }

    async getVariantEntries_(
        variants,
        authInterface: AuthInterface
    ): Promise<any> {
        // eslint-disable-next-line no-useless-catch
        try {
            const allVariants = variants.map(async (variant) => {
                // update product variant in strapi
                const result = await this.updateProductVariantInStrapi(
                    variant,
                    authInterface
                );
                return result.data?.productVariant;
            });
            return Promise.all(allVariants);
        } catch (error) {
            throw error;
        }
    }

    async createImageAssets(
        product,
        authInterface: AuthInterface
    ): Promise<any> {
        const assets = await Promise.all(
            product.images
                ?.filter((image) => image.url !== product.thumbnail)
                .map(async (image, i) => {
                    const result = await this.createEntryInStrapi({
                        type: "images",
                        id: product.id,
                        authInterface,
                        data: {
                            image_id: image.id,
                            url: image.url,
                            metadata: image.metadata || {}
                        },
                        method: "post"
                    });
                    return result?.data?.image ?? undefined;
                })
        );
        return assets || [];
    }

    getCustomField(field, type): string {
        const customOptions = this.options_[`custom_${type}_fields`];

        if (customOptions) {
            return customOptions[field] || field;
        } else {
            return field;
        }
    }

    async createEntityInStrapi<T extends BaseEntity>(
        params: CreateInStrapiParams<T>
    ): Promise<AxiosResponse | void> {
        await this.checkType(params.strapiEntityType, params.authInterface);
        const entity = await params.medusaService.retrieve(params.id, {
            select: params.selectFields,
            relations: params.relations
        });
        if (entity) {
            const result = await this.createEntryInStrapi({
                type: params.strapiEntityType,
                authInterface: params.authInterface,
                data: { data: entity },
                method: "POST"
            });
            return result;
        }
    }

    async getEntitiesFromStrapi<T extends BaseEntity>(
        params: GetFromStrapiParams<T>
    ): Promise<AxiosResponse | void> {
        await this.checkType(params.strapiEntityType, params.authInterface);
        const result = await this.getEntriesInStrapi({
            type: params.strapiEntityType,
            authInterface: params.authInterface,
            method: "get"
        });
        return result;
    }

    async createProductTypeInStrapi(
        productTypeId: string,
        authInterface: AuthInterface
    ): Promise<any> {
        return await this.createEntityInStrapi({
            id: productTypeId,
            authInterface: authInterface,

            strapiEntityType: "product-types",
            medusaService: this.productTypeService_,
            selectFields: ["id", "value"],
            relations: []
        });
    }

    async createProductInStrapi(
        productId,
        authInterface: AuthInterface
    ): Promise<any> {
        const hasType = (await this.getType("products", authInterface))
            ? true
            : false;
        if (!hasType) {
            return Promise.resolve();
        }

        // eslint-disable-next-line no-useless-catch
        try {
            const product = await this.productService_.retrieve(productId, {
                relations: [
                    "options",
                    "variants",
                    "variants.prices",
                    "variants.options",
                    "type",
                    "collection",
                    "tags",
                    "images"
                ],
                select: [
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
                ]
            });

            if (product) {
                const result = await this.createEntryInStrapi({
                    type: "products",
                    authInterface,
                    data: product,
                    method: "POST"
                });
                return result;
            }
        } catch (error) {
            throw error;
        }
    }

    async createProductVariantInStrapi(
        variantId,
        authInterface: AuthInterface
    ): Promise<any> {
        const hasType = await this.getType("product-variants", authInterface)
            .then(() => true)
            .catch((e) => false);

        if (!hasType) {
            return Promise.resolve();
        }

        // eslint-disable-next-line no-useless-catch
        try {
            const variant = await this.productVariantService_.retrieve(
                variantId,
                {
                    relations: ["prices", "options", "product"]
                }
            );

            // this.logger.info(variant)
            if (variant) {
                return await this.createEntryInStrapi({
                    type: "product-variants",
                    id: variantId,
                    authInterface,
                    data: variant,
                    method: "POST"
                });
            }
        } catch (error) {
            throw error;
        }
    }

    async createRegionInStrapi(
        regionId,
        authInterface: AuthInterface
    ): Promise<any> {
        const hasType = await this.getType("regions", authInterface)
            .then(() => true)
            .catch(() => false);
        if (!hasType) {
            this.logger.info('Type "Regions" doesnt exist in Strapi');
            return Promise.resolve();
        }

        // eslint-disable-next-line no-useless-catch
        try {
            const region = await this.regionService_.retrieve(regionId, {
                relations: [
                    "countries",
                    "payment_providers",
                    "fulfillment_providers",
                    "currency"
                ],
                select: ["id", "name", "tax_rate", "tax_code", "metadata"]
            });

            // this.logger.info(region)

            return await this.createEntryInStrapi({
                type: "regions",
                id: regionId,
                authInterface,
                data: region,
                method: "post"
            });
        } catch (error) {
            throw error;
        }
    }

    async updateRegionInStrapi(
        data,
        authInterface: AuthInterface = this.defaultAuthInterface
    ): Promise<any> {
        const hasType = await this.getType("regions", authInterface)
            .then((res) => {
                // this.logger.info(res.data)
                return true;
            })
            .catch((error) => {
                // this.logger.info(error.response.status)
                return false;
            });
        if (!hasType) {
            return Promise.resolve();
        }

        const updateFields = [
            "name",
            "currency_code",
            "countries",
            "payment_providers",
            "fulfillment_providers"
        ];

        // check if update contains any fields in Strapi to minimize runs
        const found = this.verifyDataContainsFields(data, updateFields);
        if (!found) {
            return;
        }

        // eslint-disable-next-line no-useless-catch
        try {
            const ignore = await this.shouldIgnore_(data.id, "strapi");
            if (ignore) {
                return;
            }

            const region = await this.regionService_.retrieve(data.id, {
                relations: [
                    "countries",
                    "payment_providers",
                    "fulfillment_providers",
                    "currency"
                ],
                select: ["id", "name", "tax_rate", "tax_code", "metadata"]
            });
            // this.logger.info(region)

            if (region) {
                // Update entry in Strapi
                const response = await this.updateEntryInStrapi(
                    "regions",
                    region.id,
                    authInterface,
                    region
                );
                this.logger.info("Region Strapi Id - ", response);
            }

            return region;
        } catch (error) {
            throw error;
        }
    }

    async updateProductInStrapi(
        data,
        authInterface: AuthInterface = this.defaultAuthInterface
    ): Promise<any> {
        const hasType = await this.getType("products", authInterface)
            .then((res) => {
                // this.logger.info(res.data)
                return true;
            })
            .catch((error) => {
                // this.logger.info(error.response.status)
                return false;
            });
        if (!hasType) {
            return Promise.resolve();
        }

        // this.logger.info(data)
        const updateFields = [
            "variants",
            "options",
            "tags",
            "title",
            "subtitle",
            "tags",
            "type",
            "type_id",
            "collection",
            "collection_id",
            "thumbnail"
        ];

        // check if update contains any fields in Strapi to minimize runs
        const found = this.verifyDataContainsFields(data, updateFields);
        if (!found) {
            return Promise.resolve();
        }

        // eslint-disable-next-line no-useless-catch
        try {
            const ignore = await this.shouldIgnore_(data.id, "strapi");
            if (ignore) {
                this.logger.info(
                    "Strapi has just updated this product" +
                        " which triggered this function. IGNORING... "
                );
                return Promise.resolve();
            }
            const product = await this.productService_.retrieve(data.id, {
                relations: [
                    "options",
                    "variants",
                    "variants.prices",
                    "variants.options",
                    "type",
                    "collection",
                    "tags",
                    "images"
                ],
                select: [
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
                ]
            });

            if (product) {
                await this.updateEntryInStrapi(
                    "products",
                    product.id,
                    authInterface,
                    product
                );
            }

            return product;
        } catch (error) {
            throw error;
        }
    }

    async checkType(type, authInterface): Promise<boolean> {
        let result;
        try {
            result = await this.getType(type, authInterface);
        } catch (error) {
            this.logger.error(`${type} type not found in strapi`);
            this.logger.error(JSON.stringify(error));
            result = false;
        }
        return result ? true : false;
    }

    async updateProductVariantInStrapi(
        data,
        authInterface: AuthInterface
    ): Promise<any> {
        const hasType = await this.checkType("product-variants", authInterface);

        const updateFields = [
            "title",
            "prices",
            "sku",
            "material",
            "weight",
            "length",
            "height",
            "origin_country",
            "options"
        ];

        // Update came directly from product variant service so only act on a couple
        // of fields. When the update comes from the product we want to ensure
        // references are set up correctly so we run through everything.
        if (data.fields) {
            const found =
                data.fields.find((f) => updateFields.includes(f)) ||
                this.verifyDataContainsFields(data, updateFields);
            if (!found) {
                return Promise.resolve();
            }
        }

        try {
            const ignore = await this.shouldIgnore_(data.id, "strapi");
            if (ignore) {
                return Promise.resolve();
            }

            const variant = await this.productVariantService_.retrieve(
                data.id,
                {
                    relations: ["prices", "options"]
                }
            );
            this.logger.info(JSON.stringify(variant));

            if (variant) {
                // Update entry in Strapi
                const response = await this.updateEntryInStrapi(
                    "product-variants",
                    variant.id,
                    authInterface,
                    variant
                );
                this.logger.info("Variant Strapi Id - ", response);
            }

            return variant;
        } catch (error) {
            this.logger.info("Failed to update product variant", data.id);
            throw error;
        }
    }

    async deleteProductInStrapi(
        data,
        authInterface: AuthInterface
    ): Promise<any> {
        const hasType = await this.getType("products", authInterface)
            .then(() => true)
            .catch((err) => {
                this.logger.info(err);
                return false;
            });
        if (!hasType) {
            return Promise.resolve();
        }

        const ignore = await this.shouldIgnore_(data.id, "strapi");
        if (ignore) {
            return Promise.resolve();
        }

        return await this.deleteEntryInStrapi(
            "products",
            data.id,
            authInterface
        );
    }

    async deleteProductVariantInStrapi(
        data,
        authInterface: AuthInterface
    ): Promise<any> {
        const hasType = await this.getType("product-variants", authInterface)
            .then(() => true)
            .catch((err) => {
                // this.logger.info(err)
                return false;
            });
        if (!hasType) {
            return Promise.resolve();
        }

        const ignore = await this.shouldIgnore_(data.id, "strapi");
        if (ignore) {
            return Promise.resolve();
        }

        return await this.deleteEntryInStrapi(
            "product-variants",
            data.id,
            authInterface
        );
    }

    // Blocker - Delete Region API
    async deleteRegionInStrapi(data, authInterace): Promise<any> {
        return;
    }

    async getType(type: string, authInterface: AuthInterface): Promise<any> {
        const result = await this.strapiSend({
            method: "get",
            type,
            authInterface
        });
        return result;
    }

    private async executeStrapiHealthCheck(): Promise<boolean> {
        const config = {
            url: `${this.strapi_url}/_health`
        };
        this.logger.info("Checking strapi health");
        try {
            let response = undefined;
            let timeOut = process.env.STRAPI_HEALTH_CHECK_INTERVAL
                ? parseInt(process.env.STRAPI_HEALTH_CHECK_INTERVAL)
                : 120e3;
            while (timeOut-- > 0) {
                response = await axios.head(config.url);
                if (response && response?.status) {
                    break;
                }
                await sleep(1000);
            }
            UpdateStrapiService.lastHealthCheckTime = Date.now();
            if (response) {
                UpdateStrapiService.isHealthy =
                    response.status < 300 ? true : false;
                if (UpdateStrapiService.isHealthy) {
                    this.logger.info("Strapi is healthy");
                } else {
                    this.logger.info("Strapi is unhealthy");
                }
            } else {
                UpdateStrapiService.isHealthy = false;
            }

            return UpdateStrapiService.isHealthy;
        } catch (error) {
            this.logger.error("Strapi health check failed");
            UpdateStrapiService.isHealthy = false;
            return false;
        }
    }

    async checkStrapiHealth(): Promise<boolean> {
        const currentTime = Date.now();

        const timeInterval = process.env.STRAPI_HEALTH_CHECK_INTERVAL
            ? parseInt(process.env.STRAPI_HEALTH_CHECK_INTERVAL)
            : 120e3;
        const timeDifference =
            currentTime - (UpdateStrapiService.lastHealthCheckTime ?? 0);
        const intervalElapsed = timeDifference > timeInterval;

        const result = intervalElapsed
            ? await this.executeStrapiHealthCheck()
            : UpdateStrapiService.isHealthy; /** sending last known health status */
        return result;
    }

    encrypt(text: string): any {
        return text;
        const cipher = crypto.createCipheriv(
            "aes-256-cbc",
            Buffer.from(this.key),
            this.iv
        );
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return {
            iv: this.iv.toString("hex"),
            encryptedData: encrypted.toString("hex")
        };
    }

    // Decrypting text
    decrypt(text): string {
        return text;
        const iv = Buffer.from(text.iv, "hex");
        const encryptedText = Buffer.from(text.encryptedData, "hex");
        const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            Buffer.from(this.key),
            this.iv
        );
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    async registerDefaultMedusaUser(): Promise<any> {
        try {
            const authParams = {
                ...this.options_.strapi_default_user
            };
            const registerResponse = await this.executeRegisterMedusaUser(
                authParams
            );
            return registerResponse;
        } catch (error) {
            this.logger.error(
                "unable to register default user",
                (error as Error).message
            );
        }
    }

    async deleteDefaultMedusaUser(): Promise<any> {
        try {
            const response = await this.deleteMedusaUserFromStrapi(
                this.defaultAuthInterface
            );

            delete this.userTokens[this.defaultAuthInterface.email];
            return response;
        } catch (error) {
            this.logger.error(
                "unable to delete default user: " + (error as Error).message
            );
        }
    }

    async deleteMedusaUserFromStrapi(
        authInterface: AuthInterface
    ): Promise<any> {
        const fetchedResult = await this.strapiSend({
            method: "get",
            type: "users",
            id: "me",
            data: undefined,
            authInterface
        });
        const fetchedUser = fetchedResult.data;
        this.logger.info("found user: " + JSON.stringify(fetchedResult.data));

        const result = await this.strapiSend({
            method: "delete",
            type: "users",
            id: fetchedUser.id,

            authInterface
        });
        return result;
    }

    /** Todo Create API based access
  async fetchMedusaUserApiKey(emailAddress) {

    return await this.strapiAdminSend("get")
  }

  */

    async executeSync(token: string): Promise<AxiosResponse> {
        await this.waitForHealth();
        const result = await axios.post(
            `${this.strapi_url}/strapi-plugin-medusajs/synchronise-medusa-tables`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 3600e3 /** temp workaround to stop retransmissions over 900ms*/
            }
        );
        this.logger.info("successfully initiated two way sync<-->medusa");
        return result;
    }

    async configureStrapiMedusaForUser(
        authInterface: AuthInterface
    ): Promise<any> {
        const { email } = authInterface;
        try {
            const jwt = (await this.executeLoginAsStrapiUser(authInterface))
                .token;
            if (!jwt) {
                throw Error("no jwt for this user: " + email);
            }
            const result = await this.executeSync(jwt);
            return { status: result.status };
        } catch (error) {
            // Handle error.
            this.logger.info("Unable to sync An error occurred:", error);
        }
    }

    async executeLoginAsStrapiUser(
        authInterface: AuthInterface = {
            email: this.defaultUserEmail,
            password: this.defaultUserPassword
        }
    ): Promise<UserCreds> {
        await this.waitForHealth();
        const { email, password } = authInterface;
        const authData = {
            identifier: email,
            password: password
        };
        const currentTime = Date.now();
        const lastRetrived = this.userTokens[email];
        if (currentTime - lastRetrived?.time ?? 0 < 60e3) {
            this.logger.debug("using cached user credentials ");
            return lastRetrived;
        }
        try {
            let res: AxiosResponse;

            try {
                res = await axios.post(
                    `${this.strapi_url}/api/auth/local`,
                    authData
                );
            } catch (e) {
                if (e.response.status == 429) {
                    let i = 0;
                    let timeOut: NodeJS.Timeout;
                    while (i++ < 5000) {
                        if (timeOut) {
                            clearTimeout(timeOut);
                        }
                        timeOut = setTimeout(async () => {
                            res = await axios.post(
                                `${this.strapi_url}/api/auth/local`,
                                authData
                            );
                        }, 5000 - i);
                    }
                }
            }
            // console.log("login result"+res);
            if (res?.data.jwt) {
                this.userTokens[email] = {
                    token: res.data.jwt /** caching the jwt token */,
                    time: Date.now(),
                    user: res.data.user
                };
                this.logger.info(
                    `${authData.identifier} ` +
                        "successfully logged in to Strapi"
                );
                return this.userTokens[email];
            }
        } catch (error) {
            throw new Error(
                `\n Error  ${authData.identifier} while trying to login to strapi\n` +
                    (error as Error).message
            );
        }

        return;
    }
    async getAuthorRoleId(): Promise<number> {
        const response = await this.executeStrapiAdminSend("get", "roles");
        // console.log("role:", response);
        if (response) {
            const availableRoles = response.data.data as role[];
            for (const role of availableRoles) {
                if (role.name == "Author") {
                    return role.id;
                }
            }
        }
        return -1;
    }

    async processStrapiEntry(command: StrapiSendParams): Promise<any> {
        try {
            return await this.strapiSend(command);
        } catch (e) {
            this.logger.error(e);
        }
    }

    async doesEntryExistInStrapi(
        type,
        id: string,

        authInterface: AuthInterface
    ): Promise<any> {
        return await this.processStrapiEntry({
            method: "get",
            type,
            id,
            authInterface
        });
    }

    async createEntryInStrapi(command: StrapiSendParams): Promise<any> {
        return await this.processStrapiEntry({
            ...command,
            method: "post"
        });
    }

    async getEntriesInStrapi(command: StrapiSendParams): Promise<any> {
        return await this.processStrapiEntry({
            ...command,
            method: "get"
        });
    }

    async updateEntryInStrapi(
        type,
        id,
        authInterface: AuthInterface,
        data
    ): Promise<any> {
        return await this.processStrapiEntry({
            method: "put",
            type,
            id,
            authInterface,
            data
        });
    }

    async deleteEntryInStrapi(type, id, authInterface): Promise<any> {
        return await this.processStrapiEntry({
            method: "delete",
            type,
            id,
            authInterface
        });
    }

    /* using cached tokens */
    /* @todo enable api based access */
    async strapiSend(params: StrapiSendParams): Promise<any> {
        const { method, type, id, data, authInterface } = params;

        const userCreds = await this.executeLoginAsStrapiUser(authInterface);

        try {
            return await this.executeStrapiSend(
                method,
                type,
                userCreds.token,
                id,
                data
            );
        } catch (e) {
            this.logger.error(e.message);
        }
    }
    /**
     * Blocks the process until strapi is healthy
     *
     *
     */

    async waitForHealth(): Promise<void> {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const health = await this.checkStrapiHealth();
            if (health) {
                break;
            }
            this.logger.debug("Awaiting Strapi Health");

            await sleep(1000);
        }
    }

    async executeStrapiSend(
        method: Method,
        type: string,
        token: string,
        id?: string,
        data?: any
    ): Promise<any> {
        await this.waitForHealth();
        const endPoint = `${this.strapi_url}/api/${type}${id ? "/" + id : "/"}`;
        this.logger.info(endPoint);
        const basicConfig = {
            method: method,
            url: endPoint,
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        this.logger.info(`${basicConfig.method} ${basicConfig.url}`);
        const config = data
            ? {
                  ...basicConfig,
                  data
              }
            : {
                  ...basicConfig
              };
        try {
            const result = await axios(config);
            this.logger.info(`User Endpoint fired: ${endPoint}`);
            // console.log("attempting action:"+result);
            if (result.status >= 200 && result.status < 300) {
                this.logger.info(
                    `Strapi Ok : ${method}, ${id}, ${type}, ${data}, :status:${result.status}`
                );
            }

            return result;
        } catch (error) {
            const theError = (error as Error).message;
            this.logger.error(
                `AxiosError ${
                    error.response
                        ? JSON.stringify(
                              error.response.data?.error ??
                                  error.response.data?.data
                          )
                        : ""
                }`
            );
            this.logger.info(theError);
            throw new Error(`Error while trying to ${method},
       ${id}, ${type}, ${data}  entry in strapi ${theError}`);
        }
    }

    async executeStrapiAdminSend(
        method: Method,
        type: string,
        id?: string,
        action?: string,
        data?: any
    ): Promise<any> {
        const result = await this.executeLoginAsStrapiAdmin();
        if (!result) {
            this.logger.error("No user Bearer token, check axios request");
            return;
        }
        /* if (!await this.checkStrapiHealth()) {
      return;
    }*/
        let headers = undefined;
        /** refreshed token */
        this.strapiAdminAuthToken = result.data.token;
        if (this.strapiAdminAuthToken) {
            headers = {
                "Authorization": `Bearer ${this.strapiAdminAuthToken}`,
                "Content-type": "application/json"
            };
        }
        const path = [];
        const items = [type, action, id];
        for (const item of items) {
            if (item) {
                path.push(item);
            }
        }
        const basicConfig = {
            method: method,
            url: `${this.strapi_url}/admin/${path.join("/")}`,
            headers
        };
        this.logger.info(`Admin Endpoint fired: ${basicConfig.url}`);
        const config = data
            ? {
                  ...basicConfig,
                  data
              }
            : {
                  ...basicConfig
              };
        try {
            const result = await axios(config);
            if (result.status >= 200 && result.status < 300) {
                this.logger.info(
                    `Strapi Ok : ${method}, ${id ?? ""}` +
                        `, ${type ?? ""}, ${data ?? ""}, ${
                            action ?? ""
                        } :status:${result.status}`
                );
                this.logger.info(
                    `Strapi Data : ${JSON.stringify(result.data)}`
                );
            } else {
                this.logger.info("Admin endpoint error recieved", result);
            }

            return result;
        } catch (error) {
            this.logger.info(JSON.stringify(error?.response.data.error));
            throw new Error(
                `Error while admin ${method}, ${id}, ${type}, ${JSON.stringify(
                    data
                )}, ${action} in strapi, message:${error.message}`
            );
        }
    }

    /* async registerMedusaUser(auth:UserType):Promise<any> {
    return await this.strapiAdminSend("post",
        "user", undefined, undefined, auth);
  }*/

    async executeRegisterMedusaUser(auth: MedusaUserType): Promise<any> {
        let response: AxiosResponse;
        await this.waitForHealth();
        /* if (auth.email == this.options_.strapi_default_user.email &&
      this.userTokens[auth.email].length>1) {
      return { response: this.strapiDefaultUserResponse, adminResponse: null };
    }*/

        try {
            response = await axios.post(
                `${this.strapi_url}/strapi-plugin-medusajs/create-medusa-user`,
                auth
            );
        } catch (e) {
            this.logger.error("unable to register user " + JSON.stringify(e));
        }

        return response;
    }

    async registerAdminUserInStrapi(): Promise<any> {
        const auth: AdminUserType = {
            ...this.options_.strapi_admin
        };

        return await this.executeStrapiAdminSend(
            "post",
            "register-admin",
            undefined,
            undefined,
            auth
        );

        try {
            const response = await axios.post(
                `${this.strapi_url}/admin/register-admin`,
                auth
            );
            this.logger.info("Registered Admin " + auth.email + " with strapi");
            this.logger.info("Admin profile", response.data.user);
            this.logger.info("Admin token", response.data.token);
            // console.log(response);
            this.strapiAdminAuthToken = response.data.token;
            this.userAdminProfile = response.data.user;
            return response;
        } catch (error) {
            // Handle error.
            this.logger.info("An error occurred:", error);
            throw error;
        }
    }

    fetchUserToken(email: string = this.defaultUserEmail): string {
        const token = this.userTokens[email].token;
        if (token) {
            this.logger.info("fetched token for: " + email);
        }
        return token;
    }
    async executeLoginAsStrapiAdmin(): Promise<any> {
        const auth = {
            email: this.options_.strapi_admin.email,
            password: this.options_.strapi_admin.password
        };
        await this.waitForHealth();
        try {
            let response = await axios.post(
                `${this.strapi_url}/admin/login`,
                auth,
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
            response = response.data;
            this.logger.info(
                "Logged In   Admin " + auth.email + " with strapi"
            );
            this.logger.info("Admin profile", response.data.user);
            this.logger.info("Admin token", response.data.token);

            this.strapiAdminAuthToken = response.data.token;
            this.userAdminProfile = response.data.user;
            return response;
        } catch (error) {
            // Handle error.
            this.logger.info(
                "An error occurred" + "while logging into admin:",
                error.message
            );
            throw error;
        }
    }
    async intializeServer(): Promise<any> {
        await this.registerOrLoginAdmin();
        if (this.strapiAdminAuthToken) {
            const user = (await this.registerOrLoginDefaultMedusaUser()).user;
            if (user) {
                const response = await this.configureStrapiMedusaForUser({
                    email: this.options_.strapi_default_user.email,
                    password: this.options_.strapi_default_user.password
                });
                if (response.status < 300) {
                    this.logger.info("medusa-strapi-successfully-bootstrapped");
                    return response;
                }
            } else {
                this.logger.error("unable to login default user");
            }
        } else {
            this.logger.error("unable to connect as super user");
        }
    }
    async registerOrLoginAdmin(): Promise<any> {
        try {
            await this.registerAdminUserInStrapi();
        } catch (e) {
            this.logger.info(
                "super admin already registered",
                JSON.stringify(e)
            );
        }
        return await this.executeLoginAsStrapiAdmin();
    }

    async loginAsDefaultMedusaUser(): Promise<UserCreds> {
        let response: UserCreds;
        try {
            response = await this.executeLoginAsStrapiUser(
                this.defaultAuthInterface
            );
            if (response) {
                this.strapiDefaultUserId = response.user.id;
            }
            this.logger.info("Default Medusa User Logged In");
        } catch (error) {
            this.strapiDefaultUserId = undefined;
            if (!response) {
                this.logger.error(
                    "Unable to login default medusa user: " +
                        (error as Error).message
                );
            }
        }
        return response;
    }

    async registerOrLoginDefaultMedusaUser(): Promise<UserCreds> {
        try {
            await this.registerDefaultMedusaUser();
        } catch (e) {
            this.logger.info(
                "default user already registered",
                JSON.stringify(e)
            );
        }
        return await this.loginAsDefaultMedusaUser();
    }
    verifyDataContainsFields(data: any, updateFields: any[]): boolean {
        let found = data.fields?.find((f) => updateFields.includes(f));
        if (!found) {
            try {
                const fieldsOfdata = Object.keys(data);
                found = fieldsOfdata.some((field) => {
                    return updateFields.some((uf) => {
                        return uf == field;
                    });
                });
            } catch (e) {
                this.logger.error(JSON.stringify(e));
            }
        }
        return found;
    }
}
export default UpdateStrapiService;
