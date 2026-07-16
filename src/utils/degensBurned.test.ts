import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchMock, sleepMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  sleepMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node-fetch', () => ({ default: fetchMock }));
vi.mock('node-config-ts', () => ({
  config: {
    eth: { network: 'mainnet', alchemy: { mainnet: 'alchemy-key' } },
  },
}));
vi.mock('@/contracts', () => ({ getContractAddress: () => '0xdegen' }));
vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return { ...actual, sleep: sleepMock };
});

import { fetchBurnedDegens } from './degensBurned';

function page(ownedNfts: Array<{ tokenId: string }>, pageKey?: string) {
  return {
    json: vi.fn().mockResolvedValue({
      ownedNfts: ownedNfts.map(({ tokenId }) => ({
        tokenId,
        contractAddress: '0xdegen',
        balance: '1',
      })),
      pageKey,
    }),
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  sleepMock.mockClear();
});

describe('fetchBurnedDegens', () => {
  it('collects both burn wallets, follows pagination, and sorts token IDs', async () => {
    fetchMock
      .mockResolvedValueOnce(page([{ tokenId: '9' }, { tokenId: '2' }], 'next'))
      .mockResolvedValueOnce(page([{ tokenId: '5' }]))
      .mockResolvedValueOnce(page([{ tokenId: '1' }]));

    await expect(fetchBurnedDegens()).resolves.toEqual([1, 2, 5, 9]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('&pageKey=next');
    expect(fetchMock.mock.calls[2]?.[0]).toContain('&owner=0x0000000000000000000000000000000000000001');
    expect(sleepMock).toHaveBeenCalledTimes(3);
  });

  it('returns an empty list when Alchemy is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(fetchBurnedDegens()).resolves.toEqual([]);
  });
});
