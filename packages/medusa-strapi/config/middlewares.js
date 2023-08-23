module.exports = ({ env }) => (
	{
		settings: {
			parser: {
				enabled: 'true',
				formLimit: '50mb',
				jsonLimit: '50mb',
				formidable: {
					maxFileSize: 50 * 1024 * 1024, // 50MB
				},
			},
			cache: {
				enabled: true,
				type: 'redis',
				maxAge: 2600000,
				models: ['product', 'product-collection', 'product-type', 'country'],
				redisConfig:
					process.env.AWS_ENABLED == 'true'
						? {
								host: process.env.AWS_REDIS_HOST,
								port: process.env.AWS_REDIS_PORT,
						  }
						: {
								host: process.env.REDIS_HOST,
								port: process.env.REDIS_PORT,
								password: process.env.REDIS_PASSWORD,
						  },
			},
		},
	},
	[
		'strapi::errors',
		{
			name: 'strapi::security',
			config: {
				frameguard: false,
				contentSecurityPolicy: {
					useDefaults: true,
					directives: {
						'connect-src': [
							"'self'",
							'https:',
							'http:',
							`${env('MEDUSA_BACKEND_ADMIN', 'http://localhost:7000')}`,
						],
						'img-src': [
							"'self'",
							'data:',
							'blob:',
							'res.cloudinary.com', // cloudinary images
							'lh3.googleusercontent.com', // google avatars
							'platform-lookaside.fbsbx.com', // facebook avatars
							'dl.airtable.com', // strapi marketplace
							`https://${env('AWS_BUCKET')}.s3.${env('AWS_REGION')}.amazonaws.com`,
						],
						'media-src': [
							"'self'",
							'data:',
							'blob:',
							`https://${env('AWS_BUCKET')}.s3.${env('AWS_REGION')}.amazonaws.com`,
						],
						'frame-ancestors': [`${env('MEDUSA_BACKEND_ADMIN', 'http://localhost:7000')}`],
						'frame-src': [`${env('MEDUSA_BACKEND_ADMIN', 'http://localhost:7000')}`],
					},
					upgradeInsecureRequests: null,
				},
			},
		},

		{
			name: 'strapi::poweredBy',
			config: {
				poweredBy: 'SGF Tech',
			},
		},
		{
			name: 'strapi::cors',
			config: {
				enabled: true,
				headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
				origin: [
					'http://localhost:1337',
					env('MEDUSA_BACKEND_URL'),
					env('MEDUSA_BACKEND_ADMIN'),
					env('SELF_URL'),
				],
				keepHeaderOnError: true,
			},
		},
		'strapi::logger',
		'strapi::query',
		{
			name: 'strapi::body',
			config: {
				formLimit: '256mb', // modify form body
				jsonLimit: '256mb', // modify JSON body
				textLimit: '256mb', // modify text body
				formidable: {
					maxFileSize: 250 * 1024 * 1024, // multipart data, modify here limit of uploaded file size
				},
			},
		},

		'strapi::session',
		'strapi::favicon',
		'strapi::public',
	]
);
