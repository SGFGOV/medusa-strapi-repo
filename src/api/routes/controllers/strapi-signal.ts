import { EventBusService } from "@medusajs/medusa";
import { ConfigModule, Logger } from "@medusajs/medusa/dist/types/global";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";

export interface strapiSignal {

  message:string;
  code:number;
  data:any;

}


export default async (req:Request, res:Response):Promise<any> => {
  const eventBus = req.scope.resolve("eventBusService") as EventBusService;
  let logger:Logger|Console = req.scope.resolve("logger");
  if (!logger) {
    logger=console;
  }
  const config = req.scope.resolve("configModule") as ConfigModule;
  const medusaSecret = config.projectConfig.jwt_secret;

  try {
    const message = req.body["signedMessage"];
    const decodedMessage = jwt.verify(message, medusaSecret) as strapiSignal;


    switch (decodedMessage.message) {
      case "SYNC COMPLETED":
        try {
          await eventBus.emit("strapi.sync-completed", decodedMessage );
          res.status(200);
          logger.debug("strapi sync completed");
        } catch (e) {
          res.status(400).json(e);
          logger.debug("sync failed");
        }
        break;

      default:
        try {
          await eventBus.emit("strapi.message", decodedMessage );
          res.status(200);
          logger.debug("strapi status message received");
        } catch (e) {
          res.status(400).json(e);
          logger.debug("unable to signal receipt of strapi message");
        }
        break;
    }
  } catch (e) {
    res.status(400).json(e);
    logger.error("invalid messsage received");
  }
};
