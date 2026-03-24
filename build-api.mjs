import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [resolve(__dirname, "src/api/trpc-handler.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: resolve(__dirname, "api/trpc/[trpc].mjs"),
  // Bundle all dependencies inline to avoid ERR_MODULE_NOT_FOUND in Vercel
  packages: "bundle",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

console.log("API bundle built successfully!");
