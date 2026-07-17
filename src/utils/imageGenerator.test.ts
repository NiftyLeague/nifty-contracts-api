import { describe, expect, it, vi } from 'vitest';
import { raritySelector, generateImageURL } from './imageGenerator';

vi.mock('node-config-ts', () => ({
  config: {
    imageGenerator: {
      baseURL: 'https://example.com/generate',
      version: 'v1',
      secret: 'test-secret',
    },
  },
}));

describe('raritySelector', () => {
  it('returns rarity 0 most of the time', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    expect(raritySelector(100)).toBe(0);
  });

  it('returns rarity 1 when random falls in the 6% band', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.92);
    expect(raritySelector(100)).toBe(1);
  });

  it('returns rarity 2 when random falls in the 3% band', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.97);
    expect(raritySelector(100)).toBe(2);
  });

  it('returns rarity 3 when random falls in the 1% band', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.995);
    expect(raritySelector(100)).toBe(3);
  });

  it('caps rarity at 1 for low token IDs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.995);
    expect(raritySelector(1)).toBe(1);
  });
});

describe('generateImageURL', () => {
  it('builds a URL with encoded traits and metadata', () => {
    const url = generateImageURL([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], 2, 42);
    expect(url).toContain('https://example.com/generate');
    expect(url).toContain('version=v1');
    expect(url).toContain('rarity=2');
    expect(url).toContain('token=42');
    expect(url).toContain('secret=test-secret');
    expect(url).toContain('traits=');
  });
});
