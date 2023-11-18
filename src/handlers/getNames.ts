import { createClient } from "@supabase/supabase-js";
import { Env } from "../env";

export async function getNames(env: Env) {
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: names } = await db.from("records").select("*");

  if (!names) {
    return {};
  }

  // Simplify the response format
  const formattedNames = names.reduce((acc, name) => {
    return {
      ...acc,
      [name.name]: {
        addresses: name.addresses,
        texts: name.texts,
        contenthash: name.contenthash,
      },
    };
  }, {});

  return Response.json(formattedNames, {
    status: 200,
  });
}
