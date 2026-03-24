import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [resolve(__dirname, "api/trpc/[trpc].ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: resolve(__dirname, "api/trpc/[trpc].mjs"),
  external: [],
  // Inline all dependencies to avoid ERR_MODULE_NOT_FOUND
  packages: "bundle",
  banner: {
    js: `
// Polyfill __dirname and __filename for ESM
import { createRequire } from 'module';
import { fileURLToPath as _fileURLToPath } from 'url';
import { dirname as _dirname } from 'path';
const __filename = _fileURLToPath(import.meta.url);
const __dirname = _dirname(__filename);
const require = createRequire(import.meta.url);
`
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

console.log("API bundle built successfully!");
