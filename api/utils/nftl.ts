import { config } from 'node-config-ts';
import fetch from 'node-fetch';
import { parseEther } from 'ethers';

import { NFTL_ADDRESS, NFTL_CONTRACT_NAME } from '@/constants/contracts';
import { getContractFactory } from '@/contracts';
import type { TargetNetwork } from '@/types';
import { getBurnedDegens } from './degensBurned';

export async function resolveCirculatingSupply(): Promise<string | null> {
  try {
    const secret = config.eth.etherscan;
    const supplyURI = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${NFTL_ADDRESS}&apikey=${secret}`;
    const supplyRes = await fetch(supplyURI, {});
    if (supplyRes.status < 400) {
      const { result: supply } = (await supplyRes.json()) as {
        result: string;
      };
      return supply;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function resolveUnclaimedSupply(): Promise<string | null> {
  try {
    const targetNetwork = config.eth.network as TargetNetwork;
    const nftlContract = await getContractFactory(targetNetwork, NFTL_CONTRACT_NAME);
    if (nftlContract) {
      const burnedDegens = await getBurnedDegens();
      const activeDegens = Array.from({ length: 10000 }, (_, i) => i + 1).filter(num => !burnedDegens.includes(num));
      const unclaimed = await nftlContract.accumulatedMultiCheck(activeDegens);
      return unclaimed.toString();
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function resolveTotalSupply(): Promise<string | null> {
  try {
    const circulatingSupply = await resolveCirculatingSupply();
    const unclaimedSupply = await resolveUnclaimedSupply();
    if (!circulatingSupply || !unclaimedSupply) return null;
    return (BigInt(circulatingSupply) + BigInt(unclaimedSupply)).toString();
  } catch (e) {
    return null;
  }
}

export const calculateRemainingEmissions = (): string => {
  const today = new Date();
  const endDate = new Date('2024-09-14');
  if (today.getTime() > endDate.getTime()) return parseEther('0').toString();

  const degenSupply = 9201;
  const nftlPerDay = 68.5;
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const remainingEmissions = daysRemaining * nftlPerDay * degenSupply;
  return parseEther(remainingEmissions.toString()).toString();
};

export async function resolveMaxSupply(): Promise<string | null> {
  try {
    const totalSupply = await resolveTotalSupply();
    if (!totalSupply) return null;
    const remainingEmissions = calculateRemainingEmissions();
    return (BigInt(totalSupply) + BigInt(remainingEmissions)).toString();
  } catch (e) {
    return null;
  }
}
