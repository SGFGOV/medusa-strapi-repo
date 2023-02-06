import { Request, Response, Router } from "express";
import bodyParser from "body-parser";
import * as jwt from "jsonwebtoken";

import { parseCorsOrigins } from "medusa-core-utils";
import cors from "cors";

import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate";
import { StrapiMedusaPluginOptions } from "../../../types/globals";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";
import { UserService } from "@medusajs/medusa";

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
    adminRouter.options("/login", cors(adminCors));
    adminRouter.get("/login", cors(adminCors));
    adminRouter.get("/login", authenticate());
    adminRouter.get("/login", async (req: Request, res: Response) => {
        const userService = req.scope.resolve("userService") as UserService;
        try {
            const user = await userService.retrieve(req.user.userId);
            delete user.password_hash;
            const signedCookie = jwt.sign(JSON.stringify(user), jwtSecret);
            res.cookie("__medusa_session", signedCookie);
            res.sendStatus(200);
        } catch (error) {
            res.sendStatus(500).send(JSON.stringify(error));
        }
    });

    adminRouter.delete("/login", cors(adminCors));
    adminRouter.delete("/login", (req: Request, res: Response) => {
        res.clearCookie("__medusa_session");
    });

    return adminRouter;
};
