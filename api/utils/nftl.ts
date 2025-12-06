import { config } from 'node-config-ts';
import fetch from 'node-fetch';
import { parseEther } from 'ethers';

import { NFTL_ADDRESS, NFTL_CONTRACT_NAME } from '@/constants/contracts';
import { getContractFactory } from '@/contracts';
import type { TargetNetwork } from '@/types';
import { getBurnedDegens } from './degensBurned';
import { NFTLToken } from '@/types/typechain';

/**
 * Get Etherscan chain ID for the given network
 */
function getChainId(network: TargetNetwork): number {
  switch (network) {
    case 'mainnet':
      return 1;
    case 'sepolia':
      return 11155111;
    default:
      return 1; // Default to mainnet
  }
}

export async function resolveCirculatingSupply(): Promise<string | null> {
  try {
    const secret = config.eth.etherscan;
    const targetNetwork = config.eth.network as TargetNetwork;
    const chainId = getChainId(targetNetwork);

    // Use Etherscan API V2
    const supplyURI = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=stats&action=tokensupply&contractaddress=${NFTL_ADDRESS}&apikey=${secret}`;
    const supplyRes = await fetch(supplyURI, {});
    if (supplyRes.status < 400) {
      const response = (await supplyRes.json()) as {
        result: string;
        status?: string;
        message?: string;
      };
      // Check if result is a valid number (not an error message)
      if (response.result && /^\d+$/.test(response.result)) {
        return response.result;
      }
      // If result is an error message, fall back to contract totalSupply
      console.warn('Etherscan API error, falling back to contract totalSupply:', response.result || response.message);
    }
    // Fallback: get totalSupply directly from the contract
    const nftlContract = await getContractFactory<NFTLToken>(targetNetwork, NFTL_CONTRACT_NAME);
    if (nftlContract) {
      const totalSupply = await nftlContract.totalSupply();
      return totalSupply.toString();
    }
    return null;
  } catch {
    // Final fallback: try contract totalSupply
    try {
      const targetNetwork = config.eth.network as TargetNetwork;
      const nftlContract = await getContractFactory<NFTLToken>(targetNetwork, NFTL_CONTRACT_NAME);
      if (nftlContract) {
        const totalSupply = await nftlContract.totalSupply();
        return totalSupply.toString();
      }
    } catch {
      // Ignore
    }
    return null;
  }
}

export async function resolveUnclaimedSupply(): Promise<string | null> {
  try {
    const targetNetwork = config.eth.network as TargetNetwork;
    const nftlContract = await getContractFactory<NFTLToken>(targetNetwork, NFTL_CONTRACT_NAME);
    if (nftlContract) {
      const burnedDegens = await getBurnedDegens();
      const activeDegens = Array.from({ length: 10000 }, (_, i) => i + 1).filter(num => !burnedDegens.includes(num));
      const unclaimed = await nftlContract.accumulatedMultiCheck(activeDegens);
      return unclaimed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export async function resolveTotalSupply(): Promise<string | null> {
  try {
    const circulatingSupply = await resolveCirculatingSupply();
    const unclaimedSupply = await resolveUnclaimedSupply();
    if (!circulatingSupply || !unclaimedSupply) return null;
    return (BigInt(circulatingSupply) + BigInt(unclaimedSupply)).toString();
  } catch {
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
  } catch {
    return null;
  }
}
