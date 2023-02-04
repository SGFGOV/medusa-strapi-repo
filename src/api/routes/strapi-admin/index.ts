import { Request, Response, Router } from "express";
import bodyParser from "body-parser";
import * as jwt from "jsonwebtoken";

import { parseCorsOrigins } from "medusa-core-utils";
import cors from "cors";

import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate";
import { StrapiMedusaPluginOptions } from "../../../types/globals";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";

const adminRouter = Router();
export default (
    app: Router,
    options: StrapiMedusaPluginOptions,
    config: ConfigModule
) => {
    app.use("/strapi/admin", adminRouter);
    const strapiUrl = `${options.strapi_protocol}://${options.strapi_host}:${options.strapi_port}`;

    // Authenticated routes

    // Calls all middleware that has been registered to run after authentication.

    const adminUrl = config.projectConfig.admin_cors;
    const adminCors = {
        origin: parseCorsOrigins(adminUrl),
        credentials: true
    };

    /** todo additional checks to authenticate strapi request */
    if (process.env.NODE_ENV != "test") {
        adminRouter.use(cors(adminCors));
    }
    const jwtSecret = config.projectConfig.jwt_secret;
    adminRouter.options("/strapi/admin", cors(adminCors));
    adminRouter.get("/strapi/admin", cors(adminCors));
    adminRouter.get("/strapi/admin/", authenticate());
    adminRouter.get("/strapi/admin", (req: Request, res: Response) => {
        const authorizationHeader = req.headers["authorization"];
        res.redirect(strapiUrl);
        const signedCookie = jwt.sign(authorizationHeader, jwtSecret);
        res.cookie("__medusa", signedCookie);
    });

    return adminRouter;
};
