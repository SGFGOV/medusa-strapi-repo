import { EventBusService } from "@medusajs/medusa";
import { Logger } from "@medusajs/medusa/dist/types/global";

export default async (req, resp, next) => {
    const logger = req.scope.resolve("logger") as Logger;
    const eventBus = req.scope.resolve("eventBusService") as EventBusService;
    if (logger) {
        logger.info(`Received ${req.method} ${req.url} from ${req.ip}`);
    }
    await eventBus.emit("strapi.request.received", req.url);
    next();
};
