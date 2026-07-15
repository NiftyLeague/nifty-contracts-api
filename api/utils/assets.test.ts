import fs from 'fs';
import os from 'os';
import path from 'path';

import { getAssetPath } from './assets';

describe('getAssetPath', () => {
  const cases: Array<[Parameters<typeof getAssetPath>[0], string]> = [
    ['comics', '1.png'],
    ['items', '101.gif'],
    ['degens', '1.png'],
  ];

  it.each(cases)('resolves %s -> public/images/%s relative to cwd', (kind, fileName) => {
    const expected = path.join(process.cwd(), 'public', 'images', kind, fileName);
    const resolved = getAssetPath(kind, fileName);

    // Absolute, and exactly <cwd>/public/images/<kind>/<file>. This is the
    // core of the #118 fix: the previous code built a `ContractsAPI/`
    // prefixed path (e.g. `ContractsAPI/public/images/...`) which resolved
    // to a non-existent location. It must not. An exact-equality check is
    // environment independent and does not rely on the (git-ignored) binary
    // assets being present.
    expect(path.isAbsolute(resolved)).toBe(true);
    expect(resolved).toBe(expected);
  });

  it.each(cases)('points at a real, writable directory under public/images/%s', (kind, fileName) => {
    // The committed binary assets are git-ignored, so we cannot assume the
    // resolved file exists. Instead we materialize a throwaway file at the
    // resolved directory to prove the path is correct and writable, then
    // clean it up. This guards #118 without depending on the untracked
    // image binaries being present in the checkout.
    const resolved = getAssetPath(kind, fileName);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    const probe = path.join(path.dirname(resolved), `.probe-${process.pid}-${os.hostname()}.tmp`);
    fs.writeFileSync(probe, '');
    try {
      expect(fs.existsSync(probe)).toBe(true);
    } finally {
      fs.rmSync(probe, { force: true });
    }
  });
});
