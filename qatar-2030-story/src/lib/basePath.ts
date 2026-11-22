/**
 * Prefix for the site when it is served from a subfolder (GitHub Pages serves
 * it at /<repo>/). Empty for local development. Next.js adds it to <Link> and
 * its own assets; plain URLs (downloads, the map worker) need it added by hand.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const withBase = (path: string) => `${BASE_PATH}${path}`;
