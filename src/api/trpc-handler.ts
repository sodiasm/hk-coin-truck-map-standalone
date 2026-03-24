import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import type { IncomingMessage, ServerResponse } from "http";
import { appRouter } from "../../server/routers";

// Vercel serverless function handler using the Node.js HTTP adapter
// This is compatible with Vercel's Node.js serverless runtime (IncomingMessage/ServerResponse)
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  const requestToken = (req.headers["x-admin-token"] as string) ?? "";
  const isAdmin = adminToken.length > 0 && requestToken === adminToken;

  return nodeHTTPRequestHandler({
    req,
    res,
    router: appRouter,
    createContext: async () => ({ isAdmin }),
    onError: ({ path, error }) => {
      console.error(`tRPC error on ${path}:`, error);
    },
  });
}

export const config = {
  runtime: "nodejs20.x",
};
