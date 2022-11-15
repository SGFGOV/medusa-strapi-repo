import { Router } from "express";
import bodyParser from "body-parser";
import middleware from "../../middleware";

const route = Router();

export default (app) => {
  app.use("/hooks", route);

  route.post(
      "/update-medusa",
      bodyParser.json(),
      middleware.wrap(require("./controllers/update-medusa").default),
  );

  route.post(
      "/seed",
      bodyParser.json(),
      middleware.wrap(require("./controllers/seed").default),
  );

  route.post(
      "/strapi-ready",
      bodyParser.json(),
      middleware.wrap(require("./controllers/strapi-ready").default),
  );

  return app;
};
