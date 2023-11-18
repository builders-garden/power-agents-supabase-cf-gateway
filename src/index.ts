import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";
import { makeApp } from "./server";

const routeHandler = (env: any) => {
  const { PRIVATE_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL } = env;
  const privateKey = PRIVATE_KEY as string;
  //   const address = ethers.utils.computeAddress(privateKey);
  const signer = new ethers.utils.SigningKey(privateKey);
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const app = makeApp(signer, supabaseClient, "/");

  return app;
};

module.exports = {
  fetch: function(request: Request, env: any, _context: any) {
    const router = routeHandler(env);

    return router.handle(request) as any;
  },
};
