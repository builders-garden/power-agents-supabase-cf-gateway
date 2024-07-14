import { createClient } from "@supabase/supabase-js";
import { Env } from "../env";

export async function getNames(env: Env) {
  try {
    const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const { data: names } = await db.from("records").select("*");

    if (!names) {
      return Response.json({}, { status: 200 });
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
  } catch (error) {
    console.error(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
