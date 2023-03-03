import { Request, Response } from "express";
import { GetFromStrapiParams, AuthInterface } from "../../../types/globals";
import UpdateStrapiService from "../../../services/update-strapi";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";

export default async (req: Request, res: Response) => {
    const updateStrapiService = req.scope.resolve(
        "updateStrapiService"
    ) as UpdateStrapiService;

    let authInterface: AuthInterface = {
        email: process.env.STRAPI_MEDUSA_EMAIL,
        password: process.env.STRAPI_MEDUSA_PASSWORD
    };
    if (!authInterface.email) {
        authInterface = updateStrapiService.defaultAuthInterface;
    }

    const strapiEntityType = req.params.type;
    const id = req.params.id;

    const strapiParams: GetFromStrapiParams = {
        authInterface,
        strapiEntityType: strapiEntityType,
        id
    };

    const data = await updateStrapiService.getEntitiesFromStrapi(strapiParams);
    res.send(data);
    return data;
};
