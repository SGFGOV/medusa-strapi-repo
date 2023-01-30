import { Router } from "express";
import bodyParser from "body-parser";
import fetchContent from "../../controllers/content/fetch-content";
import { parseCorsOrigins } from "medusa-core-utils";
import cors from "cors";
import utils from "../../middleware/utils";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";
const contentRouter = Router();
export default (app, options, config: ConfigModule) => {
    app.use("/strapi", contentRouter);
    const storeCors =
        config.projectConfig.store_cors || "http://localhost:8000";
    const strapiCors = {
        origin: parseCorsOrigins(storeCors),
        credentials: true
    };
    if (process.env.NODE_ENV != "test") {
        contentRouter.use(cors(strapiCors));
        contentRouter.get(cors(config.projectConfig.store_cors));
        contentRouter.options(cors(config.projectConfig.store_cors));
    }
    contentRouter.use(utils);
    contentRouter.get("/content/:type/:id", fetchContent);
    contentRouter.get("/content/:type/", fetchContent);

    return contentRouter;
};
