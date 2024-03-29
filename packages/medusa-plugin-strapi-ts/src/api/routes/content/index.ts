import { Router } from 'express';
import bodyParser from 'body-parser';
import fetchContent from '../../controllers/content/fetch-content';
import { parseCorsOrigins } from 'medusa-core-utils';
import cors from 'cors';
import utils from '../../middleware/utils';
import { ConfigModule } from '@medusajs/medusa/dist/types/global';
const contentRouter = Router();
export default (app, options, config: ConfigModule) => {
	app.use('/strapi/content', contentRouter);
	const storeCors = config.projectConfig.store_cors || 'http://localhost:8000';
	const adminCors = config.projectConfig.admin_cors || 'http://localhost:8000';
	const strapiCors = {
		origin: [...parseCorsOrigins(storeCors), ...parseCorsOrigins(adminCors)],
		credentials: true,
	};
	if (process.env.NODE_ENV != 'test') {
		contentRouter.use(cors(strapiCors));
		/* contentRouter.get('/:type/:id',cors(config.projectConfig.store_cors));
        contentRouter.options('/:type',cors(config.projectConfig.store_cors));*/
	}
	contentRouter.use(utils);
	/*app.set('query parser', (queryString) => {
		return new URLSearchParams(queryString);
	});*/
	contentRouter.options('/:type/:id', (req, res, next) => {
		res.setHeader('Allow', 'GET').sendStatus(200);
	});
	contentRouter.options('/:type', (req, res, next) => {
		res.setHeader('Allow', 'GET').sendStatus(200);
		//next();
	});
	contentRouter.get('/:type/:id', fetchContent);
	contentRouter.get('/:type', fetchContent);

	return contentRouter;
};
