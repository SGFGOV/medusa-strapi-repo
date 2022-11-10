import { Router } from "express";
import routes from "./routes";

/* TODO second argument pluginConfig: Record<string, unknown> part of PR https://github.com/medusajs/medusa/pull/959 not yet in master */
export default (rootDirectory: string): Router => {
  const app = Router();

  routes(app, rootDirectory);

  return app;
};
