import { Router } from "express";
import bodyParser from "body-parser";
import middleware from "../../middleware";
import fetchContent from "../controllers/fetch-content";
import { parseCorsOrigins } from "medusa-core-utils";
import cors from "cors";
import utils from "../../middleware/utils";

export default (app, container, config) => {
    const contentRouter = Router();
    const storeCors = config.store_cors || "http://localhost:8000";
    const strapiCors = {
        origin: parseCorsOrigins(storeCors),
        credentials: true
    };
    contentRouter.use(cors(strapiCors));
    contentRouter.get(cors(config.store_cors));
    contentRouter.options(cors(config.store_cors));
    contentRouter.use(utils);
    contentRouter.use(bodyParser);
    contentRouter.use(fetchContent);

    return contentRouter;
};
