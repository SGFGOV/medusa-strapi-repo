import { EventBusService } from '@medusajs/medusa';
import { ConfigModule, Logger } from '@medusajs/medusa/dist/types/global';
import { NextFunction, Request, Response } from 'express';
import seedHandler from './seed';
import updateHandler from './update-medusa';
import * as jwt from 'jsonwebtoken';
import { EntityManager } from 'typeorm';

export interface StrapiSignalInterface {
	message: string;
	code: number;
	data: any;
}

export default async (req: Request, res: Response, next: NextFunction): Promise<any> => {
	const eventBus = req.scope.resolve('eventBusService') as EventBusService;
	const manager = req.scope.resolve('manager') as EntityManager;
	let logger: Logger | Console = req.scope.resolve('logger');
	if (!logger) {
		logger = console;
	}
	const config = req.scope.resolve('configModule') as ConfigModule;
	const medusaSecret = config.projectConfig.jwt_secret;

	try {
		const message = req.body['signedMessage'];
		const decodedMessage = jwt.verify(message, medusaSecret) as StrapiSignalInterface;
		req['decodedMessage'] = decodedMessage;
		switch (decodedMessage.message) {
			case 'SYNC COMPLETED':
				try {
					await eventBus.withTransaction(manager).emit('strapi.sync-completed', decodedMessage);
					logger.debug('valid strapi sync completed');
					res.sendStatus(200);
				} catch (e) {
					logger.debug('sync failed');
					res.sendStatus(400);
				}
				break;
			case 'STATUS UPDATE':
				try {
					await eventBus.withTransaction(manager).emit('strapi.status.update', decodedMessage);
					res.sendStatus(200);
					logger.debug('valid update strapi status message received');
				} catch (e) {
					res.status(400).json(e);
					logger.debug('strapi status message receive failed');
				}
				break;
			case 'SEED': {
				logger.debug('valid strapi seed request received');
				return seedHandler(req as any, res, next);
			}

			case 'UPDATE MEDUSA': {
				return updateHandler(req, res, next);
			}

			default:
				try {
					await eventBus.emit('strapi.message', decodedMessage);
					res.sendStatus(200);
					logger.debug('valid strapi status message received');
				} catch (e) {
					logger.debug('unable to signal receipt of strapi message');
					res.sendStatus(400);
				}
				break;
		}
	} catch (e) {
		logger.error('Error occur while receiving strapi signal.', {
			'error.message': e.message,
		});
		res.status(500).send('Error occur while receiving strapi signal - ' + e.message);
	}
};
