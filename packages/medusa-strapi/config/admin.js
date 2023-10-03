// const sgftechSaasFormStrategy = require("@sgftech/passport-saasform");

module.exports = ({ env }) => ({
	auth: {
		secret: env('ADMIN_JWT_SECRET'),
		events: {
			onConnectionSuccess(e) {},
			onConnectionError(e) {},
			// ...
			onSSOAutoRegistration(e) {
				const { user, provider } = e;

				console.log(`A new user (${user.id}) has been automatically registered using ${provider}`);
			},
		},
		providers: [
			/*  {
        uid: "saasform",
        displayName: "SGF-Login",
        icon: "",
        createStrategy: (strapi) =>
          new sgftechSaasFormStrategy(
            {
              saasformServerUrl: env("AUTH_SERVER"),
              saasformUrl: env("REDIRECT_AFTER_LOGIN_URL"),
              appBaseUrl: env("REDIRECT_AFTER_LOGIN_URL"),
              callbackURL:
                strapi.admin.services.passport.getStrategyCallbackURL(
                  "saasform"
                ),
            },
            (request, accessToken, refreshToken, profile, done) => {
              done(null, {
                email: accessToken.email,
                firstname: accessToken.name,
                lastname: accessToken.name,
              });
            }
          ),
      },*/
		],
	},
	apiToken: {
		salt: env('API_TOKEN_SALT'),
	},
	rateLimit: process.env.NODE_ENV == 'test' ? { enabled: false } : { interval: 60000, max: 100000 },
	transfer: {
		token: {
			salt: env('TRANSFER_TOKEN_SALT'),
		},
	},
});
