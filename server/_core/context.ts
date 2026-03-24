import { ENV } from "./env";

export type TrpcContext = {
  /** true when the request carries a valid ADMIN_TOKEN */
  isAdmin: boolean;
};

/**
 * Creates the tRPC request context from an Express request.
 * Admin access is granted when the request carries the correct ADMIN_TOKEN
 * either as a Bearer token in the Authorization header or as the
 * x-admin-token header.
 */
export function createContext({ req, res }: { req: any; res: any }): TrpcContext {
  const authHeader = (req.headers?.["authorization"] as string) ?? "";
  const tokenHeader = (req.headers?.["x-admin-token"] as string) ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const token = bearerToken || tokenHeader;
  const isAdmin = Boolean(token && token === ENV.adminToken);
  return { isAdmin };
}

/**
 * Creates the tRPC request context from a Web Fetch API Request.
 * Used by the Vercel serverless function.
 */
export function createFetchContext({ req }: { req: Request }): TrpcContext {
  const authHeader = req.headers.get("authorization") ?? "";
  const tokenHeader = req.headers.get("x-admin-token") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const token = bearerToken || tokenHeader;
  const isAdmin = Boolean(token && token === ENV.adminToken);
  return { isAdmin };
}
