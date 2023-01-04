import bodyParser from "body-parser";
import { Router } from "express";
import { default as hooksRouter } from "./routes/hooks";

/* TODO second argument pluginConfig: Record<string, unknown> part of PR https://github.com/medusajs/medusa/pull/959 not yet in master */
export default (rootDirectory: string): Router => {
    const app = Router();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use("/hooks", hooksRouter);

    return app;
};
