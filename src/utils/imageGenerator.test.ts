import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';

mock.module('node-config-ts', () => ({
  config: {
    imageGenerator: {
      baseURL: 'https://images.example/generate',
      secret: 'test-secret',
      version: 'v2',
    },
  },
}));

import { generateImageURL, raritySelector, downloadImage } from './imageGenerator';

describe('raritySelector', () => {
  afterEach(() => {});

  it('returns rarity 0 most of the time', () => {
    spyOn(Math, 'random').mockReturnValue(0.1);
    expect(raritySelector(100)).toBe(0);
  });

  it('returns rarity 1 when random falls in the 6% band', () => {
    spyOn(Math, 'random').mockReturnValue(0.92);
    expect(raritySelector(100)).toBe(1);
  });

  it('returns rarity 2 when random falls in the 3% band', () => {
    spyOn(Math, 'random').mockReturnValue(0.97);
    expect(raritySelector(100)).toBe(2);
  });

  it('returns rarity 3 when random falls in the 1% band', () => {
    spyOn(Math, 'random').mockReturnValue(0.995);
    expect(raritySelector(100)).toBe(3);
  });

  it('caps rarity at 1 for low token IDs', () => {
    spyOn(Math, 'random').mockReturnValue(0.995);
    expect(raritySelector(1)).toBe(1);
  });
});

describe('generateImageURL', () => {
  it('builds the correct image URL with params', () => {
    const traits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const url = generateImageURL(traits, 2, 42);
    expect(url).toContain('https://images.example/generate');
    expect(url).toContain('rarity=2');
    expect(url).toContain('token=42');
    expect(url).toContain('secret=test-secret');
    expect(url).toContain('version=v2');
  });
});

describe('downloadImage', () => {
  it('calls fetch with the correct URL', async () => {
    // mock node-fetch via module mock since the source imports from 'node-fetch'
    const fetchSpy = mock(async (_url: string) => ({
      body: {
        pipe: mock(() => {}),
        on: mock((_event: string, cb: () => void) => {
          if (_event === 'finish') cb();
        }),
      },
    }));

    mock.module('node-fetch', () => ({
      default: fetchSpy,
    }));
    mock.module('fs', () => ({
      default: { createWriteStream: mock(() => ({})) },
      createWriteStream: mock(() => ({})),
    }));

    const url = 'https://example.com/image.png';
    const dest = '/tmp/dest.png';

    // Re-import to get the version with mocked deps
    const mod = await import('./imageGenerator');
    await mod.downloadImage(url, dest);

    expect(fetchSpy).toHaveBeenCalledWith(url);
  });
});
