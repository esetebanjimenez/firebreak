import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * The GitHub Pages build.
 *
 * Deliberately separate from `vite.config.ts`, which stays exactly as the
 * platform expects it: TanStack Start, Nitro on the Vercel preset, and the
 * middleware that injects head chrome per request. Pages has no server to run
 * any of that, and bending the main config into serving two targets would put
 * the Vercel deploy at risk for no gain.
 *
 * So this is a plain Vite SPA over the same `src/`. The only files it does not
 * share are `pages/index.html` and `pages/main.tsx`.
 */

/**
 * `og:image` has to be an absolute URL to be any use to a crawler, and that
 * URL is not known until we know where Pages is serving from. The workflow
 * passes it in; locally it falls back to a relative path, which renders the
 * page correctly and only costs a share-card preview.
 */
function baseUrlPlugin(): Plugin {
  const base = (process.env.PAGES_BASE_URL ?? "").trim();
  const prefix = base ? `${base.replace(/\/+$/, "")}/` : "./";
  return {
    name: "firebreak:pages-base-url",
    transformIndexHtml: (html) => html.replaceAll("__BASE_URL__", prefix),
  };
}

export default defineConfig({
  root: "pages",
  // Relative asset URLs, so one bundle works at a project path, a user site or
  // a custom domain without being rebuilt for each.
  base: "./",
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [baseUrlPlugin(), tailwindcss(), react()],
  build: {
    outDir: fileURLToPath(new URL("./dist-pages", import.meta.url)),
    emptyOutDir: true,
  },
});
