import { config } from 'node-config-ts';
import fetch from 'node-fetch';
import { ContractName, TargetNetwork } from '../types';
import { DEGEN_CONTRACT_NAME } from '../constants/contracts';
import { getContractAddress } from '../contracts';

export default async function refreshOpenSea(
  targetNetwork: TargetNetwork,
  tokenId: string | number,
  contractName: ContractName = DEGEN_CONTRACT_NAME,
) {
  console.log(`⚠️  Refreshing OpenSea data for tokenID:`, tokenId);
  const chain = targetNetwork === 'mainnet' ? 'ethereum' : 'sepolia';
  const contract = getContractAddress(targetNetwork, contractName);
  const baseURL = `https://${targetNetwork === 'sepolia' ? 'testnets-' : ''}api.opensea.io/api/v2`;
  const refreshAPI = `${baseURL}/chain/${chain}/contract/${contract}/nfts/${tokenId}/refresh`;
  const headers = { 'X-API-KEY': config.eth.opensea };
  const response = await fetch(refreshAPI, { method: 'POST', headers });
  if (response.status < 400) {
    console.log('✅ OpenSea metadata refreshed');
    return response.json();
  } else {
    console.error('❌ OpenSea metadata refresh failed:', response.statusText);
    return null;
  }
}
