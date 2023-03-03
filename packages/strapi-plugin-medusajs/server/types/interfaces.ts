export interface RoleParams {
	username: string;
	password: string;
	firstname: string;
	lastname: string;
	email: string;
	blocked: boolean;
	isActive: boolean;
}

export interface MedusaUserParams extends RoleParams {
	confirmed: boolean;
	blocked: boolean;
	provider: string;
	role?: number;
}
