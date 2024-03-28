import { config } from 'node-config-ts';
import { AlchemyProvider, Wallet } from 'ethers';
import type { TargetNetwork } from '../types';

/**
 * Get Ethers Wallet Instance with signer
 */
export async function getWallet(targetNetwork?: TargetNetwork): Promise<Wallet> {
  const network = targetNetwork || config.eth.network;
  const provider = new AlchemyProvider(network, config.eth.alchemy);
  const privateKey = config.eth.pk;
  return new Wallet(privateKey, provider);
}
