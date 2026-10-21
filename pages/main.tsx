/**
 * Entry point for the static GitHub Pages build.
 *
 * The app that ships to Vercel is a TanStack Start app: a router, a server
 * shell, and Nitro middleware that injects the platform's head chrome at
 * request time. Pages serves files and nothing else, so none of that can run
 * there.
 *
 * It does not need to. The game is one route with no loader, no server
 * function and no database — state lives in zustand and localStorage — so the
 * static build mounts the same `<Firebreak />` component directly and skips
 * the router entirely. Everything below `components/` and `game/` is shared
 * with the Vercel build; only this file and `index.html` are specific to
 * Pages.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Firebreak } from "@/components/firebreak-app";
import "./styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Firebreak />
    </StrictMode>,
  );
}
