/** Paths that may appear in search results. Everything else is noindex. */
export function isIndexablePath(pathname: string): boolean {
  return pathname === "/";
}

export function isSeoPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export const NOINDEX_HEADER = "noindex, nofollow, noarchive";
