import { FindConfig } from '@medusajs/medusa/dist/types/common';
import { Method } from 'axios';
import { BaseEntity } from '@medusajs/medusa';

export interface StrapiMedusaPluginOptions {
	sync_on_init?: boolean;
	enable_auto_retry?: boolean;
	encryption_algorithm: string;
	strapi_protocol: string;
	strapi_host: string;
	strapi_default_user: MedusaUserType;
	strapi_admin: AdminUserType;
	strapi_port: number;
	strapi_secret?: string;
	strapi_public_key?: string;
	strapi_ignore_threshold: number;
	enable_marketplace?: boolean;
	strapi_healthcheck_timeout?: number;
	auto_start?: boolean;
	max_page_size?: number;
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
	method?: Method;
	type: string;
	authInterface: AuthInterface;
	data?: BaseEntity;
	id?: string;
	action?: string;
	username?: string;
	query?: string;
}

export interface StrapiAdminSendParams {
	method?: Method;
	type: string;
	data?: any;
	id?: string;
	action?: string;
	username?: string;
	query?: string;
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

export interface GetFromStrapiParams {
	id?: string;
	authInterface: AuthInterface;
	strapiEntityType: string;
	urlParams?: Record<string, string>;
	urlQuery?: Record<string, unknown>;
}
