import type { Request, Response } from "express";
import { ENV } from "./env";

export type TrpcContext = {
  req: Request;
  res: Response;
  /** true when the request carries a valid ADMIN_TOKEN */
  isAdmin: boolean;
};

/**
 * Creates the tRPC request context.
 * Admin access is granted when the request carries the correct ADMIN_TOKEN
 * either as a Bearer token in the Authorization header or as the
 * x-admin-token header.
 */
export function createContext({ req, res }: { req: Request; res: Response }): TrpcContext {
  const authHeader = (req.headers["authorization"] as string) ?? "";
  const tokenHeader = (req.headers["x-admin-token"] as string) ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const token = bearerToken || tokenHeader;
  const isAdmin = Boolean(token && token === ENV.adminToken);
  return { req, res, isAdmin };
}
