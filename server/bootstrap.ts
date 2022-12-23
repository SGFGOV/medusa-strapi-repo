/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import {
    config,
    createMedusaRole,
    deleteAllEntries,
    enabledCrudOnModels,
    hasMedusaRole
} from "./services/setup";
import chalk from "chalk";
import { RoleParams } from "./types/interfaces";

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

export async function hasSuperUser(): Promise<boolean> {
    strapi.log.debug("Checking if Superuser exists");
    const superAdminRole = await strapi.service("admin::user")?.exists();
    return superAdminRole ? true : false;
}

export async function hasAuthorRole(): Promise<boolean> {
    strapi.log.debug("Checking if Author Role Exists");
    const authorRole = await strapi
        .service("admin::role")
        ?.exists({ name: "Author" });
    return authorRole ? true : false;
}

export async function hasEditorRole(): Promise<boolean> {
    strapi.log.debug("Checking if Author Role Exists");
    const editorRole = await strapi
        .service("admin::role")
        ?.exists({ name: "Editor" });
    return editorRole ? true : false;
}

async function createSuperUser(): Promise<void> {
    strapi.log.warn("No SuperUser found. Creating Superuser now....");
    const params = {
        username: process.env.SUPERUSER_USERNAME || "SuperUser",
        password: process.env.SUPERUSER_PASSWORD || "MedusaStrapi1",
        firstname: process.env.SUPERUSER_FIRSTNAME || "Medusa",
        lastname: process.env.SUPERUSER_LASTNAME || "Commerce",
        email: process.env.SUPERUSER_EMAIL || "support@medusa-commerce.com",
        blocked: false,
        isActive: true
    };
    const adminRolesService = strapi.service("admin::role");
    const superAdminRole = await adminRolesService?.getSuperAdmin();
    await createUserWithAdminRole(params, superAdminRole);
}

export async function createUserWithAdminRole(
    params: RoleParams,
    role: { id: number }
): Promise<any> {
    if (strapi.service("admin::user")) {
        if (strapi.service("admin::user")?.create) {
            try {
                const create = strapi.service("admin::user")?.create!;
                const user = await create({
                    email: params.email,
                    firstname: params.firstname,
                    username: params.username,
                    lastname: params.lastname,
                    password: params.password,
                    registrationToken: null,
                    isActive: true,
                    roles: [role.id]
                });

                strapi.log.info("admin account created");
                return user;
            } catch (error) {
                strapi.log.error(error);
            }
        }
    }
}

async function createDefaultAdminRoles(): Promise<void> {
    try {
        const hasAdmin = await strapi.service("admin::user")?.exists();

        if (hasAdmin) {
            return;
        }

        const adminRolesService = strapi.service("admin::role");
        const superAdminRole = await adminRolesService?.getSuperAdmin();

        if (!superAdminRole) {
            strapi.log.warn(
                "Superuser role doesn't exist on the server.. Creating super user"
            );
            const result = await adminRolesService?.createRolesIfNoneExist();

            strapi.log.warn(
                "Successfully created super user admin role, author admin role and editor admin roles"
            );
        }
    } catch (e) {
        const error = e as Error;
        strapi.log.error(`${error.message},${error.stack},${error.cause}`);
    }
}

export default async (StrapiObject: any): Promise<void> => {
    const { strapi } = StrapiObject;
    const userServicePlugin = strapi.plugins["users-permissions"];
    strapi.log.info("Attempting to start medusa plugin");
    config(strapi);
    try {
        if (!(await hasSuperUser())) {
            await createDefaultAdminRoles();
            await createSuperUser();
            await deleteAllEntries();
        } else {
            strapi.log.info("Found a Superuser account.");
        }

        let medusaRoleId = await hasMedusaRole();

        if (!medusaRoleId) {
            const userPermissionsService = await userServicePlugin.services[
                "users-permissions"
            ];
            try {
                await userPermissionsService.initialize();

                const permissions = await userServicePlugin.services[
                    "users-permissions"
                ].getActions(userServicePlugin);

                // eslint-disable-next-line guard-for-in
                for (const permission in permissions) {
                    if (permissions[permission].controllers) {
                        enabledCrudOnModels(
                            permissions[permission].controllers
                        );
                    }
                }
                await createMedusaRole(permissions);
                medusaRoleId = await hasMedusaRole();
            } catch (e) {
                strapi.log.error(
                    chalk.yellowBright(
                        "Medusa plugin error " + (e as Error).message
                    )
                );
            }
        }

        strapi.log.info("Medusa plugin successfully started");
    } catch (e) {
        strapi.log.error("Medusa plugin error " + (e as Error).message);
    }
};
