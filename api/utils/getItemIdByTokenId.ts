import { Contract, type BaseContract } from 'ethers';
import { config } from 'node-config-ts';
import type { TargetNetwork } from '@/types';
import { COMICS_BURNER_CONTRACT_NAME } from '@/constants/contracts';
import { getDeployedContract } from '@/contracts';
import { getProvider } from './wallet';

const network = config.eth.network as TargetNetwork;

function getBurnerContract() {
  const provider = getProvider();
  const { address, abi } = getDeployedContract(network, COMICS_BURNER_CONTRACT_NAME);
  return new Contract(address, abi, provider) as BaseContract;
}

async function getItemIdByTokenId(tokenId: string): Promise<bigint> {
  const contract = getBurnerContract();
  const itemId: bigint = await contract['itemIdByTokenId'](tokenId);
  return itemId;
}

export async function getItemIdByTokenId_SAFE(tokenId: string): Promise<bigint> {
  const contract = getBurnerContract();
  const itemIndex: bigint = await contract['itemIndex']();
  if (BigInt(tokenId) > itemIndex) throw new Error(`Item ID not found for token ID: ${tokenId}`);

  const itemId: bigint = await getItemIdByTokenId(tokenId);

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
