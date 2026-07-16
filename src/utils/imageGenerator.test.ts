import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('node-config-ts', () => ({
  config: {
    imageGenerator: {
      baseURL: 'https://images.example/generate',
      secret: 'test-secret',
      version: 'v2',
    },
  },
}));

import { generateImageURL, raritySelector } from './imageGenerator';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('raritySelector', () => {
  it('uses the weighted background table', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(raritySelector(10)).toBe(0);

    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(raritySelector(10)).toBe(3);
  });

  it('caps rare backgrounds for the first three tokens', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(raritySelector(3)).toBe(1);
  });
});

describe('generateImageURL', () => {
  it('serializes every trait and generator option', () => {
    const traits = Array.from({ length: 22 }, (_, index) => index + 1);
    const url = new URL(generateImageURL(traits, 2, 42));

    expect(`${url.origin}${url.pathname}`).toBe('https://images.example/generate');
    expect(url.searchParams.get('version')).toBe('v2');
    expect(url.searchParams.get('secret')).toBe('test-secret');
    expect(url.searchParams.get('rarity')).toBe('2');
    expect(url.searchParams.get('token')).toBe('42');
    expect(JSON.parse(url.searchParams.get('traits') ?? '[]')).toEqual([
      ['Tribe', 1],
      ['Skin Color', 2],
      ['Fur Color', 3],
      ['Eye Color', 4],
      ['Pupil Color', 5],
      ['Hair', 6],
      ['Mouth', 7],
      ['Beard', 8],
      ['Top', 9],
      ['Outerwear', 10],
      ['Print', 11],
      ['Bottom', 12],
      ['Footwear', 13],
      ['Belt', 14],
      ['Hat', 15],
      ['Eyewear', 16],
      ['Piercing', 17],
      ['Wrist', 18],
      ['Hands', 19],
      ['Neckwear', 20],
      ['Left Item', 21],
      ['Right Item', 22],
    ]);
  });
});
