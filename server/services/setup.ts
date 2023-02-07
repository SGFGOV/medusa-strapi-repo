import { Strapi } from "@strapi/strapi";
import { default as axios } from "axios";
import _ from "lodash";
import * as jwt from "jsonwebtoken";
import { createUserWithAdminRole, hasAuthorRole } from "../bootstrap";
import { MedusaUserParams } from "../types/interfaces";

let strapi: any;

export function config(myStrapi: Strapi): void {
    strapi = myStrapi;
}

export type StrapiSeedType =
    | Record<string, { medusa_id?: string }[]>
    | Record<string, { medusa_id?: string }>
    | { medusa_id?: string };

export interface StrapiSeedInterface {
    meta: {
        pageNumber: number;
        pageLimit: number;
        hasMore: Record<string, boolean>;
    };
    data: Record<string, StrapiSeedType[]>;
}

export async function hasMedusaRole(): Promise<number | undefined> {
    strapi.log.debug('Checking if "Medusa" role exists');
    try {
        const result = await strapi
            .query("plugin::users-permissions.role")
            .findOne({
                where: { name: "Medusa" }
            }); /** all users created via medusa will be medusas */
        if (result) {
            strapi.log.info("Found role named Medusa");
            return result.id;
        }
        return;
    } catch (e) {
        strapi.log.error("Not Found role named Medusa");
        return;
    }
}

export function enabledCrudOnModels(controllers: any): void {
    Object.keys(controllers).forEach((key) => {
        strapi.log.info(
            `Enabling CRUD permission on model "${key}" for role "Medusa"`
        );
        Object.keys(controllers[key]).forEach((action) => {
            controllers[key][action].enabled = true;
        });
    });
}

export async function createMedusaRole(
    permissions: any
): Promise<number | undefined> {
    try {
        const medusRoleId = await hasMedusaRole();
        if (medusRoleId) {
            return medusRoleId;
        }
    } catch (e) {
        const error = e as Error;
        strapi.log.warn(
            "Unable to determine with medusa role exists: " +
                error.message +
                ":" +
                error.stack
        );
    }

    strapi.log.debug('Creating "Medusa" role');
    const role = {
        name: "Medusa",
        description: "reusing medusa role",
        permissions,
        users: []
    };
    try {
        const roleCreation = await strapi.plugins[
            "users-permissions"
        ].services.role.createRole(role);
        if (roleCreation && roleCreation.length) {
            strapi.log.info('Role - "Medusa" created successfully');
            return roleCreation[0].role.id;
        }
    } catch (e) {
        const error = e as Error;
        strapi.log.warn(
            "Unable to create with medusa role: " +
                error.message +
                ":" +
                error.stack
        );
        return -1;
    }
}

export async function hasMedusaUser(strapi: Strapi): Promise<number | boolean> {
    strapi.log.debug('Checking if "medusa_user" exists');
    const user = await strapi.query("plugin::users-permissions.user").findOne({
        username: "medusa_user"
    });
    if (user && user.id) {
        strapi.log.info('Found user with username "medusa_user"');
        return user.id;
    } else {
        strapi.log.warn('User with username "medusa_user" not found');
        return false;
    }
}

export async function deleteAllEntries(): Promise<void> {
    const plugins = await strapi.plugins["users-permissions"].services[
        "users-permissions"
    ].initialize();

    const permissions = await strapi.plugins["users-permissions"].services[
        "users-permissions"
    ].getActions(plugins);

    //  const controllers = permissions[permission].controllers
    // flush only apis
    const apisToFlush = Object.keys(permissions).filter((value) => {
        return value.startsWith("api::") != false;
    });
    for (const key of apisToFlush) {
        const controllers = permissions[key].controllers;
        for (const controller of Object.keys(controllers)) {
            const uid = `${key}.${controller}`;
            try {
                await strapi.entityService.deleteMany(uid);
                strapi.log.info(`flushed entity ${uid}`);
            } catch (error) {
                strapi.log.error(
                    "unable to flush entity " + uid,
                    JSON.stringify(error)
                );
            }
        }
    }
    strapi.log.info("All existing entries deleted");
}

export async function verifyOrCreateMedusaUser(
    medusaUser: MedusaUserParams
): Promise<any> {
    const users = await strapi.plugins[
        "users-permissions"
    ].services.user.fetchAll({
        filters: {
            email: medusaUser.email /** email address is unique */
        }
    });
    if (users.length) {
        return users[0];
    } else {
        return await createMedusaUser(medusaUser);
    }
}

export async function createMedusaUser(
    medusaUser: MedusaUserParams
): Promise<any> {
    let medusaRole;
    strapi.log.info("creating medusa user");
    try {
        medusaRole = await hasMedusaRole();
    } catch (error) {
        strapi.log.error("medusa role doesn't exist", (error as Error).message);
    }

    const params = _.cloneDeep(medusaUser);
    params["role"] = medusaRole;
    try {
        const user = await strapi.plugins[
            "users-permissions"
        ].services.user.add(params);
        if (user && user.id) {
            strapi.log.info(
                `User ${params.username} ${params.email} created successfully with id ${user.id}`
            );

            strapi.log.info(
                `Attaching admin author role to ${params.username} ${params.email}`
            );

            const authorRole = await hasAuthorRole();
            if (authorRole) {
                const adminRolesService = strapi.service("admin::role");
                const authorRole = await adminRolesService.findOne({
                    name: "Author"
                });
                try {
                    const result = await createUserWithAdminRole(
                        params,
                        authorRole
                    );
                    if (result) {
                        strapi.log.info(
                            `Attached admin author role to ${params.username} ${params.email}`
                        );
                    }
                } catch (e) {
                    strapi.log.info(
                        `Unable to attach admin author role to ${params.username} ${params.email}`
                    );
                }
            }

            return user;
        } else {
            strapi.log.error(
                `Failed to create user  ${params.username} ${params.email} `
            );
            return false;
        }
    } catch (error) {
        strapi.log.error((error as Error).message);
        return false;
    }
}

export interface StrapiSignal {
    message: string;
    code: number;
    data: any;
}
export interface MedusaData {
    status: number;
    data: any;
    error?: Error;
}

export async function sendSignalToMedusa(
    message = "Ok",
    code = 200,
    data?: Record<string, any>
): Promise<MedusaData | undefined> {
    if (process.env.NODE_ENV == "test") {
        // return;
    }

    const medusaServer = `${
        process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    }`;
    const strapiSignalHook = `${medusaServer}/strapi/hooks/strapi-signal`;
    const messageData = {
        message,
        code,
        data
    };
    if ((await checkMedusaReady(medusaServer)) == 0) {
        strapi.log.error("abandoning, medusa server dead");
        return;
    }
    try {
        const signedMessage = jwt.sign(
            messageData,
            process.env.MEDUSA_STRAPI_SECRET || "no-secret"
        );
        const result = await axios.post(strapiSignalHook, {
            signedMessage: signedMessage
        });
        return {
            status: result.status,
            data: result.data
        };
    } catch (error) {
        strapi.log.error(
            `unable to send message to medusa server  ${
                (error as Error).message
            }`
        );
    }
}

export async function synchroniseWithMedusa(): Promise<boolean | undefined> {
    const medusaServer = `${
        process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    }`;
    const medusaSeedHookUrl = `${medusaServer}/strapi/hooks/seed`;

    // return;

    await checkMedusaReady(medusaServer);

    let seedData: StrapiSeedInterface;
    let pageNumber;
    try {
        strapi.log.info(
            `attempting to sync connect with medusa server on ${medusaSeedHookUrl}`
        );
        const signalData = await sendSignalToMedusa("SEED");
        seedData = signalData?.data as StrapiSeedInterface;
        pageNumber = seedData?.meta.pageNumber;
    } catch (e) {
        strapi.log.info(
            "Unable to Fetch Seed Data from Medusa server.Please check configuartion" +
                `${JSON.stringify(e)}`
        );
        return false;
    }
    // IMPORTANT: Order of seed must be maintained. Please don't change the order
    if (!seedData) {
        return false;
    }
    let continueSeed;
    do {
        continueSeed = false;
        const products = seedData?.data?.products;
        const regions = seedData?.data?.regions;
        const shippingOptions = seedData?.data?.shippingOptions;
        const paymentProviders = seedData?.data?.paymentProviders;
        const fulfillmentProviders = seedData?.data?.fulfillmentProviders;
        const shippingProfiles = seedData?.data?.shippingProfiles;
        const productCollections = seedData?.data?.productCollections;
        const stores = seedData?.data?.stores;
        try {
            const servicesToSync = {
                "api::fulfillment-provider.fulfillment-provider":
                    fulfillmentProviders,
                "api::payment-provider.payment-provider": paymentProviders,
                "api::region.region": regions,
                "api::shipping-option.shipping-option": shippingOptions,
                "api::shipping-profile.shipping-profile": shippingProfiles,
                "api::product-collection.product-collection":
                    productCollections,
                "api::product.product": products,
                "api::store.store": stores
            };
            const strapiApiServicedDataRecievedFromMedusa =
                Object.values(servicesToSync);
            const strapiApiServicesNames = Object.keys(servicesToSync);
            for (let i = 0; i < strapiApiServicesNames.length; i++) {
                if (
                    strapiApiServicedDataRecievedFromMedusa[i] &&
                    strapiApiServicedDataRecievedFromMedusa[i]?.length > 0
                ) {
                    try {
                        await strapi.services[
                            strapiApiServicesNames[i]
                        ].bootstrap(strapiApiServicedDataRecievedFromMedusa[i]);
                    } catch (e) {
                        strapi.log.info(
                            "unable to bootstrapi",
                            JSON.stringify(e)
                        );
                    }
                } else {
                    strapi.log.info(
                        `Nothing to sync ${strapiApiServicesNames[i]}  no data` +
                            ` recieved in page ${pageNumber}`
                    );
                }
            }
        } catch (e) {
            strapi.log.info(
                "Unable to Sync with to Medusa server. Please check data recieved",
                JSON.stringify(e)
            );
            return false;
        }
        if (seedData) {
            const dataSets = Object.keys(seedData.data);

            for (let j = 0; j < dataSets.length; j++) {
                /** fetching more pages */
                if (seedData.meta.hasMore[dataSets[j]]) {
                    continueSeed = true;
                    try {
                        strapi.log.info(
                            `Continuing to sync: Page ${pageNumber + 1} `,
                            medusaSeedHookUrl
                        );
                        seedData = (
                            await sendSignalToMedusa("SEED", 200, {
                                meta: { pageNumber: pageNumber + 1 }
                            })
                        )?.data as StrapiSeedInterface;
                        pageNumber = seedData?.meta.pageNumber;
                    } catch (e) {
                        strapi.log.info(
                            "Unable to Sync with to Medusa server. Please check data recieved",
                            JSON.stringify(e)
                        );
                        return false;
                    }
                    break;
                }
            }
        }
    } while (continueSeed);

    strapi.log.info("SYNC FINISHED");
    const result = (await sendSignalToMedusa("SYNC COMPLETED"))?.status == 200;
    return result;
}

export async function sendResult(
    type: string,
    result: any
): Promise<MedusaData | undefined> {
    const postRequestResult = await sendSignalToMedusa("UPDATE MEDUSA", 200, {
        type,
        data: result
    });

    if (
        postRequestResult?.status ??
        (0 < 300 && postRequestResult?.status) ??
        0 >= 200
    ) {
        strapi.log.info(`update to ${type} posted successfully`);
    } else {
        strapi.log.info(`error updating type ${type}  posted successfully`);
    }
    return postRequestResult;
}

async function checkMedusaReady(
    medusaServer: string,
    timeout = 30e3,
    attempts = 1000
): Promise<number> {
    let medusaReady = false;
    while (!medusaReady && !(process.env.NODE_ENV == "test") && attempts--) {
        try {
            const response = await axios.head(`${medusaServer}/health`);
            medusaReady = response.status < 300 && response.status >= 200;
            if (medusaReady) {
                break;
            }
            await new Promise((r) => setTimeout(r, timeout));
        } catch (e) {
            // console.log(e);

            strapi.log.info(
                "Unable to connect to Medusa server. Please make sure Medusa server is up and running",
                JSON.stringify(e)
            );
            // process.exit(1)
        }
    }
    return attempts;
}

const setup = {
    createMedusaUser,
    synchroniseWithMedusa,
    deleteAllEntries,
    hasMedusaRole,
    hasMedusaUser,
    sendResult
};

export default setup;
