import { EventBusService, MiddlewareService } from "@medusajs/medusa";
import middlewares from "@medusajs/medusa/dist/api/middlewares";
import { Request, Response, Router } from "express";
import { parseCorsOrigins } from "medusa-core-utils";
import { default as hooksRouter } from "./routes/hooks";
import cors from "cors";
import { Logger } from "@medusajs/medusa/dist/types/global";
import middleware from "./middleware/";
import fetchContent from "../api/routes/controllers/content";

export default (app, container, config) => {
    const contentRouter = Router();
    app.use("/strapi", contentRouter);
    const middlewareService = container.resolve(
        "middlewareService"
    ) as MiddlewareService;

    middlewareService.usePreAuthentication(contentRouter);

    // Authenticated routes
    contentRouter.use(middlewares.authenticate());

    // Calls all middleware that has been registered to run after authentication.
    middlewareService.usePostAuthentication(contentRouter);

    contentRouter.use(async (req: Request, res: Response, next) => {
        const logger = req.scope.resolve("logger") as Logger;
        const eventBus = req.scope.resolve(
            "eventBusService"
        ) as EventBusService;
        if (logger) {
            logger.info(`Received ${req.method} ${req.url} from ${req.ip}`);
        }
        await eventBus.emit("strapi.content.request.received", req.url);
        next();
    });

    const storeCors = config.store_cors || "http://localhost:8000";

    const strapiCors = {
        origin: parseCorsOrigins(storeCors),
        credentials: true
    };

    contentRouter.get("/content/*", cors(config.store_cors));
    contentRouter.get("/content/*", middleware.wrap(fetchContent));
    return contentRouter;
};
