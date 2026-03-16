import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

/** Open to all — no authentication required. */
export const publicProcedure = t.procedure;

/** Requires a valid ADMIN_TOKEN in the request headers. */
export const adminProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin token required",
      });
    }
    return next({ ctx });
  }),
);
