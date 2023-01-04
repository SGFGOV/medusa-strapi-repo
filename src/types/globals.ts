import { FindConfig } from "@medusajs/medusa/dist/types/common";
import { strapiSignal } from "api/routes/controllers/strapi-signal";
import { Method } from "axios";

export interface StrapiMedusaPluginOptions {
    encryption_algorithm: string;
    strapi_protocol: string;
    strapi_host: string;
    strapi_default_user: MedusaUserType;
    strapi_admin: AdminUserType;
    strapi_port: string;
    strapi_secret?: string;
    strapi_public_key?: string;
    strapi_ignore_threshold: number;
    enable_marketplace?: boolean;
}

export type userCreds = {
    token: string;
    time: number;
    user: { id: string; email: string };
};
export type Tokens = {
    [key: string]: userCreds;
};

export interface AuthInterface {
    email?: string;
    password?: string;
    apiKey?: string /** todo implementation  */;
}

export type AdminUserType = {
    email: string;
    username?: string;
    password: string;
    firstname: string;
    name?: string;
    lastname?: string;
};
export type MedusaUserType = {
    username?: string;
    password?: string;
    email: string;
    firstname: string;
    confirmed: boolean;
    blocked: boolean;
    provider?: string;
};
export interface StrapiSendParams {
    method: Method;
    type: string;
    authInterface: AuthInterface;
    data?: any;
    id?: string;
    username?: string;
}

export interface CreateInStrapiParams<T> {
    id: string;
    authInterface: AuthInterface;
    strapiEntityType: string;
    medusaService: {
        retrieve: (id: string, config: FindConfig<T>) => Promise<T>;
    };
    selectFields: (keyof T)[];
    relations: string[];
}

export interface GetFromStrapiParams<T> {
    id?: string;
    authInterface: AuthInterface;
    strapiEntityType: string;
}
