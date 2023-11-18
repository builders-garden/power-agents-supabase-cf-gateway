import { Router } from "itty-router";

import { Env } from "./env";
import { getCcipRead, getName, getNames } from "./handlers";
import { createCors } from "itty-cors";

const { preflight, corsify } = createCors({ origins: ["*"] });
const router = Router();

router
  .all("*", preflight)
  .get("/lookup/*", (request, env) => getCcipRead(request, env))
  .get("/get/:name", (request, env) => getName(request, env))
  .get("/names", (request, env) => getNames(env))
  .all("*", () => new Response("Not found", { status: 404 }));

// Handle requests to the Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env).then(corsify);
  },
};
