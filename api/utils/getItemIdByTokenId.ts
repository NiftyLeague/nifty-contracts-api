import { Contract, type BaseContract } from 'ethers';
import { config } from 'node-config-ts';
import type { TargetNetwork } from '@/types';
import { COMICS_BURNER_CONTRACT_NAME } from '@/constants/contracts';
import { getDeployedContract } from '@/contracts';
import { getProvider } from './wallet';

export async function getItemIdByTokenId(tokenId: string): Promise<bigint> {
  const targetNetwork = config.eth.network as TargetNetwork;
  const provider = getProvider();
  const { address, abi } = getDeployedContract(targetNetwork, COMICS_BURNER_CONTRACT_NAME);
  const contract = new Contract(address, abi, provider) as BaseContract;
  const itemId: bigint = await contract['itemIdByTokenId'](tokenId);

  // fix if itemId is zero
  if (itemId === 0n) {
    // find the non-zero itemId in the previous tokenIds and replace zero with it
    let prevTokenId = Number(tokenId);
    let prevItemId: bigint;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      prevTokenId -= 1;
      prevItemId = await contract['itemIdByTokenId'](prevTokenId);

      if (prevItemId !== 0n) {
        return prevItemId;
      }
    }
  }
  return itemId;
}
