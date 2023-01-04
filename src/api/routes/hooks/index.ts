import { Request, Response, Router } from "express";
import bodyParser from "body-parser";
import middleware from "../../middleware";
import { Logger } from "@medusajs/medusa/dist/types/global";
import { EventBusService } from "@medusajs/medusa";

const hooksRouter = Router();
const updateMedusa = require("../controllers/update-medusa").default;
const seed = require("../controllers/seed").default;
const strapiSignal = require("../controllers/strapi-signal").default;

hooksRouter.use(async (req: Request, res: Response, next) => {
    const logger = req.scope.resolve("logger") as Logger;
    const eventBus = req.scope.resolve("eventBusService") as EventBusService;
    if (logger) {
        logger.info(`Received ${req.method} ${req.url} from ${req.ip}`);
    }
    await eventBus.emit("strapi.hook.fired", req.body);
    next();
});

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

export default hooksRouter;
