import { Router } from "express";
import bodyParser from "body-parser";
import fetchContent from "../../controllers/content/fetch-content";
import { parseCorsOrigins } from "medusa-core-utils";
import cors from "cors";
import utils from "../../middleware/utils";
const contentRouter = Router();
export default (app, options, config) => {
    app.use("/strapi", contentRouter);
    const storeCors = config.store_cors || "http://localhost:8000";
    const strapiCors = {
        origin: parseCorsOrigins(storeCors),
        credentials: true
    };
    contentRouter.use(cors(strapiCors));
    contentRouter.get(cors(config.store_cors));
    contentRouter.options(cors(config.store_cors));
    contentRouter.use(utils);
    contentRouter.get("/content/:type/:id", fetchContent);

    return contentRouter;
};
