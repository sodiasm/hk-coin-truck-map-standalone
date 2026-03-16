export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** Plain token used to authenticate admin API calls. Set via ADMIN_TOKEN env var. */
  adminToken: process.env.ADMIN_TOKEN ?? "change-me-admin-token",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT ?? "3000"),
};
