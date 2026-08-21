/**
 * csso ships no types and has no @types package.
 *
 * Only the one function this site calls is declared, rather than a guess at
 * the whole surface: a narrow declaration that is right beats a broad one
 * that drifts.
 */
declare module 'csso' {
  export function minify(
    source: string,
    options?: { restructure?: boolean; comments?: boolean | string },
  ): { css: string };
}
