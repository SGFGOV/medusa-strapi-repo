import { Router } from "express";
import bodyParser from "body-parser";
import middleware from "../../middleware";

const route = Router();

export default (app) => {
  app.use("/hooks", route);

  route.post(
      "/update-medusa",
      bodyParser.json(),
      middleware.wrap(require("./update-medusa").default),
  );

  route.post(
      "/seed",
      bodyParser.json(),
      middleware.wrap(require("./seed").default),
  );

  return app;
};
