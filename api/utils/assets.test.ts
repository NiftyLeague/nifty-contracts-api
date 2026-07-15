import fs from 'fs';
import path from 'path';

import { getAssetPath } from './assets';

describe('getAssetPath', () => {
  it('resolves a comics path under public/images/comics', () => {
    const result = getAssetPath('comics', '1.png');
    expect(result).toMatch(/public[\\/]images[\\/]comics[\\/]1\.png$/);
    expect(fs.existsSync(result)).toBe(true);
  });

  it('resolves an items path under public/images/items', () => {
    const result = getAssetPath('items', '101.gif');
    expect(result).toMatch(/public[\\/]images[\\/]items[\\/]101\.gif$/);
    expect(fs.existsSync(result)).toBe(true);
  });

  it('resolves a degens path under public/images/degens', () => {
    const result = getAssetPath('degens', '1.png');
    expect(result).toMatch(/public[\\/]images[\\/]degens[\\/]1\.png$/);
    expect(fs.existsSync(result)).toBe(true);
  });

  it('produces a path under public/images/ that exists on disk', () => {
    // Regression guard for #118: a previous version of the code built
    // asset paths like `ContractsAPI/public/images/...`, which was the
    // working tree path on an older layout and stopped matching the
    // actual `public/images/...` location. Every command using the
    // helper should resolve to something that exists on disk now.
    const knownFiles: Array<[Parameters<typeof getAssetPath>[0], string]> = [
      ['comics', '1.png'],
      ['items', '101.gif'],
      ['degens', '1.png'],
    ];
    for (const [kind, fileName] of knownFiles) {
      const resolved = getAssetPath(kind, fileName);
      const segments = resolved.split(path.sep);
      // The bug was a literal `ContractsAPI/public/images/...` prefix.
      // The path should contain `public` → `images` → `<kind>` and stop
      // there, not chain through a stale `ContractsAPI` segment.
      expect(segments).toContain('public');
      expect(segments).toContain('images');
      expect(segments).toContain(kind);
      expect(fs.existsSync(resolved)).toBe(true);
    }
  });
});
