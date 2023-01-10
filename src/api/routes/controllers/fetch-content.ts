import { Request, Response } from "express";
import { GetFromStrapiParams, AuthInterface } from "../../../types/globals";
import UpdateStrapiService from "../../../services/update-strapi";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";

export default async (req: Request, res: Response) => {
    const updateStrapiService = req.scope.resolve(
        "updateStrapiService"
    ) as UpdateStrapiService;

    const authInterface: AuthInterface = {
        email: process.env.STRAPI_MEDUSA_EMAIL,
        password: process.env.STRAPI_MEDUSA_PASSWORD
    };
    const urlElements = req.url.split("/");
    const strapiEntityType = urlElements[urlElements.length - 2];
    const id = urlElements[urlElements.length - 1];

    const strapiParams: GetFromStrapiParams = {
        authInterface,
        strapiEntityType: strapiEntityType,
        id
    };

    const data = await updateStrapiService.getEntitiesFromStrapi(strapiParams);
    res.send(data);
};
