import config from 'config';
import fetch from 'node-fetch';

import { getContractAddress } from '../contracts';
import { DEGEN_CONTRACT_NAME } from '../constants/contracts';
import type { TargetNetwork } from '../types';

const BURN_ADDY1 = '0x000000000000000000000000000000000000dEaD';
const BURN_ADDY2 = '0x0000000000000000000000000000000000000001';

type NftOwned = {
  contractAddress: string;
  tokenId: string;
  balance: string;
};

export async function getBurnedDegens(): Promise<number[]> {
  try {
    const apiKey = config.get('hardhat.alchemy');
    const targetNetwork = config.get('hardhat.defaultNetwork') as TargetNetwork;
    const degenAddress = getContractAddress(targetNetwork, DEGEN_CONTRACT_NAME);
    const baseURI = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?contractAddresses[]=${degenAddress}&withMetadata=false&pageSize=100`;

    let inventoryRes: number[] = [];

    // Fetch BURN_ADDY1
    const inventoryURI1 = `${baseURI}&owner=${BURN_ADDY1}`;
    inventoryRes = await fetchAndProcess(inventoryURI1, inventoryRes);

    // Fetch BURN_ADDY2
    const inventoryURI2 = `${baseURI}&owner=${BURN_ADDY2}`;
    inventoryRes = await fetchAndProcess(inventoryURI2, inventoryRes);

    return inventoryRes.sort((a, b) => a - b);
  } catch (e) {
    return [];
  }
}

async function fetchAndProcess(inventoryURI: string, inventoryRes: number[]) {
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  let pageKey: string | null = null;

  do {
    const paginatedURI: string = pageKey != null ? `${inventoryURI}&pageKey=${pageKey}` : inventoryURI;
    const response = await fetch(paginatedURI, options);
    const { ownedNfts, pageKey: nextPageKey } = await response.json();

    inventoryRes.push(...ownedNfts.map((nft: NftOwned) => parseInt(nft.tokenId, 10)));

    pageKey = nextPageKey;
  } while (pageKey !== null);

  return inventoryRes;
}
