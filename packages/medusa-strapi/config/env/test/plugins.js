const { getDefaultRoleAssumerWithWebIdentity } = require('@aws-sdk/client-sts');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');

const providerConfigAws = (env) => {
	return {
		provider: 'aws-s3',
		sizeLimit: 250 * 1024 * 1024,
		providerOptions: {
			accessKeyId: env('AWS_ACCESS_KEY_ID'),
			secretAccessKey: env('AWS_ACCESS_SECRET'),
			credentialDefaultProvider: !env('AWS_ACCESS_KEY_ID')
				? defaultProvider({
						roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity,
				  })
				: undefined,
			region: env('S3_REGION'),
			params: {
				Bucket: env('S3_BUCKET'),
			},
		},
		actionOptions: {
			upload: {},
			uploadStream: {},
			delete: {},
		},
		breakpoints: {
			xlarge: 1920,
			large: 1000,
			medium: 750,
			small: 500,
			xsmall: 64,
		},
	};
};

const providerConfigLocal = {
	providerOptions: {
		localServer: {
			maxage: 300000,
		},
	},
};

module.exports = ({ env }) => ({
	// ...
	seo: {
		enabled: true,
	},

	// ...
	'strapi-plugin-medusajs': {
		enabled: true,
	},
	'users-permissions': {
		enabled: true,
		jwtSecret: env('JWT_SECRET', 'test-jwt'),
		config: {
			jwt: {
				expiresIn: '1h',
			},
			ratelimit:
				process.env.NODE_ENV == 'test'
					? {
							interval: 60000,
							max: 100000,
					  }
					: {
							headers: true,
					  },
		},
	},
	'strapi-plugin-sso': {
		enabled: true,
		config: {
			MEDUSA_SERVER: env('MEDUSA_BACKEND_URL', 'http://localhost:9000'),
			MEDUSA_ADMIN: env('MEDUSA_BACKEND_ADMIN', 'http://localhost:7000'),
			MEDUSA_STRAPI_SECRET: env('MEDUSA_STRAPI_SECRET', 'no_secret'),
		},
	},

	upload: {
		enabled: true,
		config: env('NODE_ENV') == 'test' ? providerConfigLocal : providerConfigAws(env),
	},

	comments: {
		enabled: true,
		config: {
			badWords: true,
			moderatorRoles: ['Authenticated'],
			approvalFlow: ['api::page.page'],
			entryLabel: {
				'*': ['Title', 'title', 'Name', 'name', 'Subject', 'subject'],
				'api::product.product': ['name'],
			},
			reportReasons: {
				MY_CUSTOM_REASON: 'MY_CUSTOM_REASON',
			},
			gql: {
				auth: true,
			},
		},
	},
	io: {
		enabled: true,
		config: {
			IOServerOptions: {
				cors: { origin: env('STORE_CORS'), methods: ['GET'] },
			},
			contentTypes: '*',
			events: [
				{
					name: 'connection',
					handler: ({ strapi }, socket) => {
						strapi.log.info(`[io] new connection with id ${socket.id}`);
					},
				},
			],
		},
	},
});
