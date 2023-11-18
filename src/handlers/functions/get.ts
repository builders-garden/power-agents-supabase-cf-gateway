import { createClient } from "@supabase/supabase-js";
import { Env } from "../../env";
import { Name } from "../../models";

export async function get(name: string, env: Env): Promise<Name | null> {
  const supabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY
  );

  const { data } = await supabaseClient
    .from("records")
    .select("*")
    .eq("name", name)
    .single();

  if (!data) {
    return null;
  }

  return data;
}
