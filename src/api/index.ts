import { Router } from "express";
import hooksRouter from "./routes/hooks";
import contentRouter from "./routes/content";

export default (app, options, config) => {
    //  app.use("/strapi", strapiRouter);
    // Authenticated routes
    const strapiRouter = Router();

    hooksRouter(strapiRouter, options);
    contentRouter(strapiRouter, options, config);

    return strapiRouter;
};
