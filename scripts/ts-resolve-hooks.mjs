/**
 * A resolve hook for the art tooling: the game's own TypeScript imports have
 * no file extension (Vite resolves those), but `node --experimental-strip-types`
 * wants one. Falling back to `<specifier>.ts` lets the art scripts import the
 * real sprite data rather than keeping a second copy of it.
 */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if (specifier.startsWith(".")) return next(`${specifier}.ts`, context);
    throw err;
  }
}
