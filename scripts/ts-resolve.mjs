// Entry point for --import: registers the extensionless-TypeScript resolve hook.
import { register } from "node:module";

register("./ts-resolve-hooks.mjs", import.meta.url);
