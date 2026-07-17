import { afterEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

vi.mock('node-fetch', () => ({ default: fetchMock }));

const mockWriteStream = {
  on: vi.fn((event: string, cb: () => void) => {
    if (event === 'finish') cb();
    return mockWriteStream;
  }),
};

vi.mock('fs', () => ({
  default: {
    createWriteStream: vi.fn().mockReturnValue(mockWriteStream),
  },
  createWriteStream: vi.fn().mockReturnValue(mockWriteStream),
}));

const { raritySelector, downloadImage } = await import('./imageGenerator');

describe('raritySelector', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

describe('downloadImage', () => {
  it('pipes the response body to the destination file', async () => {
    const mockRes = {
      body: {
        pipe: vi.fn(),
        on: vi.fn(),
      },
    };
    fetchMock.mockResolvedValue(mockRes);

    await downloadImage('https://example.com/image.png', '/tmp/dest.png');

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/image.png');
    expect(mockWriteStream.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });
});
