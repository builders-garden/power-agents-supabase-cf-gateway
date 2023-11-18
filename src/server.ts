import { Server } from "@ensdomains/ccip-read-cf-worker";
import { SupabaseClient } from "@supabase/supabase-js";
import { ethers } from "ethers";
import { Router } from "itty-router";
import { abi as IResolverService_abi } from "@ensdomains/offchain-resolver-contracts/artifacts/contracts/OffchainResolver.sol/IResolverService.json";
import { abi as Resolver_abi } from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/Resolver.sol/Resolver.json";
import { BytesLike, Result, hexConcat } from "ethers/lib/utils";
import { ETH_COIN_TYPE } from "./utils";

const Resolver = new ethers.utils.Interface(Resolver_abi);

interface DatabaseResult {
  result: any[];
  ttl: number;
}

function decodeDnsName(dnsname: Buffer) {
  const labels = [];
  let idx = 0;
  while (true) {
    const len = dnsname.readUInt8(idx);
    if (len === 0) break;
    labels.push(dnsname.slice(idx + 1, idx + len + 1).toString("utf8"));
    idx += len + 1;
  }
  return labels.join(".");
}

const queryHandlers: {
  [key: string]: (
    supabase: SupabaseClient,
    name: string,
    args: Result
  ) => Promise<DatabaseResult>;
} = {
  "addr(bytes32)": async (supabase, name, _args) => {
    const { data } = await supabase
      .from("records")
      .select("*")
      .eq("name", name)
      .single();
    if (!data) {
      return { result: [""], ttl: 60 };
    }
    const { addresses, ttl } = data;
    if (!addresses[ETH_COIN_TYPE]) {
      return { result: [""], ttl: 60 };
    }
    return { result: [addresses[ETH_COIN_TYPE]], ttl };
  },
  "addr(bytes32,uint256)": async (supabase, name, args) => {
    const { data } = await supabase
      .from("records")
      .select("*")
      .eq("name", name)
      .single();
    if (!data) {
      return { result: [""], ttl: 60 };
    }
    const { addresses, ttl } = data;
    if (!addresses[args[0]]) {
      return { result: [""], ttl: 60 };
    }
    return { result: [addresses[args[0]]], ttl };
  },
  "text(bytes32,string)": async (supabase, name, args) => {
    const { data } = await supabase
      .from("records")
      .select("*")
      .eq("name", name)
      .single();
    if (!data) {
      return { result: [""], ttl: 60 };
    }
    const { text, ttl } = data;
    if (!text[args[0]]) {
      return { result: [""], ttl: 60 };
    }
    return { result: [text[args[0]]], ttl };
  },
  "contenthash(bytes32)": async (supabase, name, _args) => {
    const { data } = await supabase
      .from("records")
      .select("*")
      .eq("name", name)
      .single();
    if (!data) {
      return { result: [""], ttl: 60 };
    }
    const { content_hash, ttl } = data;
    if (!content_hash) {
      return { result: [""], ttl: 60 };
    }
    return { result: [content_hash], ttl };
  },
};

async function query(
  supabase: SupabaseClient,
  name: string,
  data: string
): Promise<{ result: BytesLike; validUntil: number }> {
  // Parse the data nested inside the second argument to `resolve`
  const { signature, args } = Resolver.parseTransaction({ data });

  if (ethers.utils.nameprep(name) !== name) {
    throw new Error("Name must be normalised");
  }

  if (ethers.utils.namehash(name) !== args[0]) {
    throw new Error("Name does not match namehash");
  }

  const handler = queryHandlers[signature];
  if (handler === undefined) {
    throw new Error(`Unsupported query function ${signature}`);
  }

  const { result, ttl } = await handler(supabase, name, args.slice(1));
  console.log("result, ttl", result, ttl);
  return {
    result: Resolver.encodeFunctionResult(signature, result),
    validUntil: Math.floor(Date.now() / 1000 + ttl),
  };
}

export function makeServer(
  signer: ethers.utils.SigningKey,
  supabaseClient: SupabaseClient
) {
  const server = new Server();

  server.add(IResolverService_abi, [
    {
      type: "resolve",
      func: async ([encodedName, data]: Result, request) => {
        const name = decodeDnsName(Buffer.from(encodedName.slice(2), "hex"));
        // Query the database
        const { result, validUntil } = await query(supabaseClient, name, data);

        // Hash and sign the response
        let messageHash = ethers.utils.solidityKeccak256(
          ["bytes", "address", "uint64", "bytes32", "bytes32"],
          [
            "0x1900",
            request?.to,
            validUntil,
            ethers.utils.keccak256(request?.data || "0x"),
            ethers.utils.keccak256(result),
          ]
        );
        const sig = signer.signDigest(messageHash);
        const sigData = hexConcat([sig.r, sig._vs]);
        return [result, validUntil, sigData];
      },
    },
  ]);
  return server;
}

export function makeApp(
  signer: ethers.utils.SigningKey,
  supabaseClient: SupabaseClient,
  path: string
): Router {
  return makeServer(signer, supabaseClient).makeApp(path);
}
