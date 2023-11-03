import UpdateMedusaService from '../../../services/update-medusa';
import * as jwt from 'jsonwebtoken';
import { ConfigModule } from '@medusajs/medusa/dist/types/global';
import { StrapiSignalInterface } from './strapi-signal';

export interface UpdateMedusaDataInterface {
	type: string;
	data: any;
	origin: 'strapi' | 'medusa';
}

export default async (req, res, next) => {
	const config = req.scope.resolve('configModule') as ConfigModule;
	const updateMedusaService = req.scope.resolve('updateMedusaService') as UpdateMedusaService;

	try {
		const medusaSecret = config.projectConfig.jwt_secret;
		const signedMessage = req.body['signedMessage'];
		const signalRequest = jwt.verify(signedMessage, medusaSecret) as StrapiSignalInterface;
		const body = signalRequest.data as UpdateMedusaDataInterface;

		// find Strapi entry type from body of webhook
		const strapiType = body.type;
		const origin = body.origin;
		// get the ID
		let entryId: string;

		if (origin == 'medusa') {
			res.sendStatus(200);
			return;
		}

		let updated = {};
		switch (strapiType) {
			case 'product':
				entryId = body.data.medusa_id;
				updated = await updateMedusaService.sendStrapiProductToMedusa(body.data, entryId);
				break;
			case 'productVariant':
				entryId = body.data.medusa_id;
				updated = await updateMedusaService.sendStrapiProductVariantToMedusa(body.data, entryId);
				break;
			case 'region':
				entryId = body.data.medusa_id;
				updated = await updateMedusaService.sendStrapiRegionToMedusa(body.data, entryId);
				break;
			default:
				break;
		}

		res.status(200).send(updated);
	} catch (error) {
		res.status(400).send(`Webhook error: ${error.message}`);
	}
};
