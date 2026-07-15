import path from 'path';

/**
 * Asset kind directories under `assets/images/`.
 *
 * Keep this in sync with the on-disk layout — the NFT generators
 * (`generateComic`, `generateItem`, `generateNFT`, `updateDegenImage`)
 * read the source images from these directories.
 */
export type AssetKind = 'comics' | 'items' | 'degens';

/**
 * Resolve the on-disk path of a source image for a given NFT kind.
 *
 * All NFT-mutating CLI commands are expected to run from the project
 * root (the `minty` commander does `process.chdir(rootDir)` before
 * parsing args; `pnpm start` runs the API from the project root as
 * well), so we anchor the path to `process.cwd()`. This keeps the
 * helper robust to whether the code is running from `tsc`-emitted
 * JavaScript under `dist/` or from the source via `tsx`.
 */
export function getAssetPath(kind: AssetKind, fileName: string): string {
  return path.join(process.cwd(), 'assets', 'images', kind, fileName);
}
