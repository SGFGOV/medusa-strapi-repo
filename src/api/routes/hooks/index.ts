import { Router } from "express"
import bodyParser from "body-parser"
import middlewares from "../../middlewares"

const route = Router()

export default (app) => {
  app.use("/hooks", route)

  route.post(
    "/update-medusa",
    bodyParser.json(),
    middlewares.wrap(require("./update-medusa").default)
  )

  route.post(
    "/seed",
    bodyParser.json(),
    middlewares.wrap(require("./seed").default)
  )

  return app
}
