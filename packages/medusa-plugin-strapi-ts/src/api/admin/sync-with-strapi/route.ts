import { MedusaError } from '@medusajs/utils';
import {MedusaRequest , MedusaResponse} from "@medusajs/medusa"
import UpdateStrapiService from '../../../services/update-strapi';

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
	const updateStrapiService = req.scope.resolve('UpdateStrapiService') as UpdateStrapiService;

	if (updateStrapiService.strapiSuperAdminAuthToken) {
		try {
			await updateStrapiService.executeSync(updateStrapiService.strapiSuperAdminAuthToken);
		} catch (e) {
			res.sendStatus(500);
			return;
			//throw new MedusaError(MedusaError.Types.UNAUTHORIZED, e.message, 'Strapi Error');
		}
		res.sendStatus(200);
	} else {
		res.status(500).send("Strapi server hasn't been initalised");
	}
};
