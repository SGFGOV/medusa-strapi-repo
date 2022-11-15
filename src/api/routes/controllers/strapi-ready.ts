import { EventBusService } from "@medusajs/medusa";
import { Logger } from "@medusajs/medusa/dist/types/global";
import { Request, Response } from "express";

export default async (req:Request, res:Response):Promise<any> => {
  const eventBus = req.scope.resolve("eventBusService") as EventBusService;
  const logger = req.scope.resolve("logger") as Logger;
  try {
    await eventBus.emit("strapi.ready", req, {});
    res.status(200);
    logger.debug("strapi sync completed");
  } catch (e) {
    res.status(400).json(e);
    logger.debug("sync completed");
  }
};
