import { Request, Response, Router } from "express";
import bodyParser from "body-parser";
import middleware from "../../middleware";
import { Logger } from "@medusajs/medusa/dist/types/global";
import { EventBusService, MiddlewareService } from "@medusajs/medusa";
import middlewares from "@medusajs/medusa/dist/api/middlewares/";
import { parseCorsOrigins } from "medusa-core-utils";
import cors from "cors";

export default (app, container, config) => {
    const hooksRouter = Router();
    const updateMedusa = require("../controllers/update-medusa").default;
    const seed = require("../controllers/seed").default;
    const strapiSignal = require("../controllers/strapi-signal").default;
    app.use("/strapi", hooksRouter);
    const middlewareService = container.resolve(
        "middlewareService"
    ) as MiddlewareService;

    const strapiUrl = `${config.STRAPI_PROTOCOL}://${config.STRAPI_SERVER}:${config.STRAPI_PORT}`;

    middlewareService.usePreAuthentication(hooksRouter);

    // Authenticated routes
    hooksRouter.use(middlewares.authenticate());

    // Calls all middleware that has been registered to run after authentication.
    middlewareService.usePostAuthentication(hooksRouter);

    hooksRouter.use(async (req: Request, res: Response, next) => {
        const logger = req.scope.resolve("logger") as Logger;
        const eventBus = req.scope.resolve(
            "eventBusService"
        ) as EventBusService;
        if (logger) {
            logger.info(`Received ${req.method} ${req.url} from ${req.ip}`);
        }
        await eventBus.emit("strapi.hook.fired", req.body);
        next();
    });

    const strapiCors = {
        origin: parseCorsOrigins(strapiUrl),
        credentials: true
    };

    /** todo additional checks to authenticate strapi request */
    hooksRouter.use(cors(strapiCors));

    hooksRouter.post(
        "/update-medusa",
        bodyParser.json(),
        middleware.wrap(updateMedusa)
    );

    hooksRouter.post("/seed", bodyParser.json(), middleware.wrap(seed));

    hooksRouter.post(
        "/strapi-signal",
        bodyParser.json(),
        middleware.wrap(strapiSignal)
    );
    return hooksRouter;
};
