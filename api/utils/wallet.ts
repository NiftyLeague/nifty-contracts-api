import { AlchemyProvider, Wallet } from 'ethers';
import type { TargetNetwork } from '../types';
import { getEnv } from './env';

/**
 * Get Ethers Wallet Instance with signer
 */
export async function getWallet(targetNetwork?: TargetNetwork): Promise<Wallet> {
  const network = targetNetwork || getEnv('HARDHAT_NETWORK');
  const provider = new AlchemyProvider(network, getEnv('ALCHEMY_API_KEY'));
  const privateKey = getEnv('OWNER_ACCOUNT_PRIVATE_KEY');
  return new Wallet(privateKey, provider);
}
