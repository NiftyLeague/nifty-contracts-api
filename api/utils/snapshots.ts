import { config } from 'node-config-ts';
import { groupBy, union } from 'lodash-es';
import { getContractFactory } from '@/contracts';
import { COMICS_CONTRACT_NAME, ITEMS_CONTRACT_NAME } from '@/constants/contracts';
import type { TargetNetwork, AlchemyOwnersResponse, Snapshot, TokenBalance } from '@/types';
import type { NiftyItemL2, NiftyLaunchComics } from '@/types/typechain';
import { getItemIdByTokenId_SAFE } from '@/utils/getItemIdByTokenId';
import { getItemsRecursive } from '@/utils/getItemsRecursive';

const targetNetwork = config.eth.network as TargetNetwork;
const apiKey = config.eth.alchemy[targetNetwork];
const baseAlchemyURI = `https://eth-${targetNetwork}.g.alchemy.com/nft/v3/${apiKey}`;

const BURN_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000001',
  '0x000000000000000000000000000000000000dEaD',
];

export async function getComicsHolderSnapshot(): Promise<Snapshot> {
  try {
    const contract = await getContractFactory<NiftyLaunchComics>(targetNetwork, COMICS_CONTRACT_NAME);
    const contractAddress = await contract.getAddress();

    const response = await fetch(
      `${baseAlchemyURI}/getOwnersForContract?contractAddress=${contractAddress}&withTokenBalances=true`,
      { method: 'GET', headers: { accept: 'application/json' } },
    );

    const snapshot: Snapshot = [];

    if (response.ok) {
      const { owners } = (await response.json()) as AlchemyOwnersResponse;
      snapshot.push(
        ...owners
          .filter(({ ownerAddress }) => !BURN_ADDRESSES.includes(ownerAddress))
          .map(({ ownerAddress, tokenBalances }) => ({
            address: ownerAddress,
            ids: tokenBalances.map(({ tokenId }) => parseInt(tokenId, 10)),
            values: tokenBalances.map(({ balance }) => parseInt(balance, 10)),
          })),
      );
    }

    return snapshot;
  } catch {
    return [];
  }
}

async function getItemIds(tokenBalances: TokenBalance[]): Promise<number[]> {
  const ids: number[] = [];
  for (const { tokenId } of tokenBalances) {
    ids.push(100 + Number(await getItemIdByTokenId_SAFE(tokenId)));
  }
  return ids;
}

async function getItemsMainnetHolders(): Promise<Snapshot> {
  try {
    const contract = await getContractFactory<NiftyItemL2>(targetNetwork, ITEMS_CONTRACT_NAME);
    const contractAddress = await contract.getAddress();

    const response = await fetch(
      `${baseAlchemyURI}/getOwnersForContract?contractAddress=${contractAddress}&withTokenBalances=true`,
      { method: 'GET', headers: { accept: 'application/json' } },
    );

    const snapshot: Snapshot = [];

    if (response.ok) {
      const { owners } = (await response.json()) as AlchemyOwnersResponse;
      snapshot.push(
        ...(await Promise.all(
          owners
            .filter(({ ownerAddress }) => !BURN_ADDRESSES.includes(ownerAddress))
            .map(async ({ ownerAddress, tokenBalances }) => ({
              address: ownerAddress,
              ids: await getItemIds(tokenBalances),
              values: tokenBalances.map(({ balance }) => parseInt(balance, 10)),
            })),
        )),
      );
    }

    return snapshot;
  } catch {
    return [];
  }
}

type ItemBalances = {
  Cape: number;
  Halo: number;
  'Diamond Bat': number;
  'Bread Bat': number;
  'Purple Bat': number;
  Companion: number;
  'Citadel Key': number;
};

async function getItemsImmutableHolders(): Promise<Snapshot> {
  try {
    const result = await getItemsRecursive();
    const holders = groupBy(result, 'user');
    const snapshot: Snapshot = [];

    for (const [address, items] of Object.entries(holders)) {
      const groupedItemBal = Object.values(groupBy(items, 'metadata.item_id')).map(group => ({
        [group[0].metadata.name]: group.length,
      }));
      const itemBalances = Object.assign({}, ...groupedItemBal) as ItemBalances;

      const result = [
        { id: 101, value: itemBalances.Cape },
        { id: 102, value: itemBalances.Halo },
        { id: 103, value: itemBalances['Diamond Bat'] },
        { id: 104, value: itemBalances['Bread Bat'] },
        { id: 105, value: itemBalances['Purple Bat'] },
        { id: 106, value: itemBalances.Companion },
        { id: 107, value: itemBalances['Citadel Key'] },
      ];

      snapshot.push({
        address,
        ids: result.filter(({ value }) => value > 0).map(({ id }) => id),
        values: result.filter(({ value }) => value > 0).map(({ value }) => value),
      });
    }

    return snapshot;
  } catch {
    return [];
  }
}

async function combineItemSnapshots(snapshots: Snapshot): Promise<Snapshot> {
  const snapshot = Object.values(
    snapshots.reduce((acc, holder) => {
      const address = holder.address.toLowerCase();
      if (!acc[address]) {
        acc[address] = holder;
      } else {
        acc[address] = {
          address,
          ids: union(acc[address].ids, holder.ids),
          values: acc[address].values.map((value, idx) => value + holder.values[idx]),
        };
      }
      return acc;
    }, {}),
  ) as Snapshot;

  return snapshot;
}

export async function getItemsHolderSnapshot(): Promise<Snapshot> {
  try {
    const ethSnapshot: Snapshot = await getItemsMainnetHolders();
    const imxSnapshot: Snapshot = await getItemsImmutableHolders();

    const snapshot = combineItemSnapshots([...ethSnapshot, ...imxSnapshot]);

    return snapshot;
  } catch {
    return [];
  }
}

export const getCombinedSnapshot = async (): Promise<Snapshot> => {
  try {
    const comics = await getComicsHolderSnapshot();
    const items = await getItemsHolderSnapshot();

    return Object.values(
      [...comics, ...items].reduce((acc, holder) => {
        const address = holder.address.toLowerCase();
        if (!acc[address]) {
          acc[address] = holder;
        } else {
          acc[address] = {
            address,
            ids: [...acc[address].ids, ...holder.ids],
            values: [...acc[address].values, ...holder.values],
          };
        }
        return acc;
      }, {}),
    );
  } catch {
    return [];
  }
};
