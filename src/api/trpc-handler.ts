import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/routers";
import { createFetchContext } from "../../server/_core/context";

// Vercel serverless function handler using the fetch adapter
// Uses the edge runtime which natively supports the Web Fetch API (Request/Response)
export default async function handler(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createFetchContext,
    onError: ({ path, error }) => {
      console.error(`tRPC error on ${path}:`, error);
    },
  });
}

export const config = {
  runtime: "edge",
};
