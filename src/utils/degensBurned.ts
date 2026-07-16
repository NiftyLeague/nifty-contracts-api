import { config } from 'node-config-ts';
import fetch from 'node-fetch';

import { getContractAddress } from '@/contracts';
import { DEGEN_CONTRACT_NAME } from '@/constants/contracts';
import type { TargetNetwork } from '@/types';
import { sleep, withCache } from './api';

const BURN_ADDY1 = '0x000000000000000000000000000000000000dEaD';
const BURN_ADDY2 = '0x0000000000000000000000000000000000000001';

const BURN_LIST_TTL_MS = 60_000;

const FETCH_TIMEOUT_MS = 10000;

// node-fetch v3 accepts an AbortSignal timeout option. Keeps Alchemy paged calls
// from hanging the function up to maxDuration on a slow/dead upstream.
const fetchWithTimeout = (url: string, options: any) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

type NftOwned = {
  contractAddress: string;
  tokenId: string;
  balance: string;
};

export async function fetchBurnedDegens(): Promise<number[]> {
  try {
    const targetNetwork = config.eth.network as TargetNetwork;
    const apiKey = config.eth.alchemy[targetNetwork];
    const degenAddress = getContractAddress(targetNetwork, DEGEN_CONTRACT_NAME);
    const baseURI = `https://eth-${targetNetwork}.g.alchemy.com/nft/v3/${apiKey}`;
    const endpoint = `${baseURI}/getNFTsForOwner?contractAddresses[]=${degenAddress}&withMetadata=false&pageSize=100`;

    let inventoryRes: number[] = [];

    // Fetch BURN_ADDY1
    const inventoryURI1 = `${endpoint}&owner=${BURN_ADDY1}`;
    inventoryRes = await fetchAndProcess(inventoryURI1, inventoryRes);

    // BURN_ADDY1 and BURN_ADDY2 are independent Alchemy queries (different
    // owner filters), so no inter-call delay is needed between them.
    // Fetch BURN_ADDY2
    const inventoryURI2 = `${endpoint}&owner=${BURN_ADDY2}`;
    inventoryRes = await fetchAndProcess(inventoryURI2, inventoryRes);

    return inventoryRes.sort((a, b) => a - b);
  } catch {
    return [];
  }
}

// Memoized for 60s so routine traffic doesn't hit Alchemy on every call. The
// cache falls back to the last-good value on transient upstream failure.
export const getBurnedDegens = withCache(BURN_LIST_TTL_MS, fetchBurnedDegens);

interface FetchResponse {
  ownedNfts: NftOwned[];
  pageKey?: string;
}

async function fetchAndProcess(inventoryURI: string, inventoryRes: number[]) {
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  let pageKey: FetchResponse['pageKey'] = undefined;

  do {
    const paginatedURI: string = pageKey ? `${inventoryURI}&pageKey=${pageKey}` : inventoryURI;
    const response = await fetchWithTimeout(paginatedURI, options);

    const { ownedNfts, pageKey: nextPageKey } = (await response.json()) as FetchResponse;
    if (ownedNfts) inventoryRes.push(...ownedNfts.map((nft: NftOwned) => parseInt(nft.tokenId, 10)));

    pageKey = nextPageKey;
    await sleep(300); // Padding between Alchemy NFT API paged calls
  } while (pageKey);

  return inventoryRes;
}
