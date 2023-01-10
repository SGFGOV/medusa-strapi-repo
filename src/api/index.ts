import { Router } from "express";
import hooksRouter from "./routes/hooks";
import contentRouter from "./routes/content";

export default (app) => {
    //  app.use("/strapi", strapiRouter);
    // Authenticated routes
    const strapiRouter = Router();
    strapiRouter.use("/strapi/hooks", hooksRouter as any);
    strapiRouter.use("/strapi/content", contentRouter);
    return strapiRouter;
};
