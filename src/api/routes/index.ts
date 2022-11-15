import { Router } from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getConfigFile } from "medusa-core-utils";

import middlewares from "../middleware";

const route = Router();

export default (app: Router, rootDirectory: string): Router => {
  app.use("/my-custom-route", route);

  /* const { configModule } = getConfigFile(rootDirectory,
     "medusa-config") as Record<string, unknown>;
  const { projectConfig } = configModule as
  { projectConfig: { store_cors: string } };

  const corsOptions = {
    origin: projectConfig.store_cors.split(","),
    credentials: true,
  };*/

  app.use("/hooks", route);

  route.post(
      "/update-medusa",
      bodyParser.json(),
      middlewares.wrap(require("./update-medusa").default),
  );

  route.post(
      "/seed",
      bodyParser.json(),
      middlewares.wrap(require("./seed").default),
  );


  return app;
};
