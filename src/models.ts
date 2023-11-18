import z from "zod";

export const ZodName = z.object({
  name: z.string().regex(/^[a-z0-9-.]+$/),
  owner: z.string(),
  addresses: z.record(z.any()).optional(),
  texts: z.record(z.any()).optional(),
  contenthash: z.string().optional(),
});

export const ZodNameWithSignature = ZodName.extend({
  signature: z.object({
    hash: z.string(),
    message: z.string(),
  }),
});

export type Name = z.infer<typeof ZodName>;
export type NameWithSignature = z.infer<typeof ZodNameWithSignature>;

export interface NameInSupabase {
  name: string;
  owner: string;
  addresses: any | null;
  texts: any | null;
  contenthash: string | null;
}
