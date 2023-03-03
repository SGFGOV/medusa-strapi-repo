import { Router } from 'express';
import hooksRouter from './routes/hooks';
import contentRouter from './routes/content';
import { ConfigModule } from '@medusajs/medusa/dist/types/global';
import adminRouter from './routes/strapi-admin';
import { getConfigFile } from 'medusa-core-utils';

export default (app, options, config: ConfigModule) => {
	//  app.use("/strapi", strapiRouter);
	// Authenticated routes
	if (!config) {
		/** to support standard @medusajs/medusa */
		const { configModule } = getConfigFile(app, 'medusa-config');
		config = configModule as ConfigModule;
	}
	const strapiRouter = Router();

	hooksRouter(strapiRouter, options);
	contentRouter(strapiRouter, options, config);
	adminRouter(strapiRouter, options, config);

	return strapiRouter;
};
