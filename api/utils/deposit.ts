import type { BytesLike } from 'ethers';
import config from 'config';
import fetch from 'node-fetch';
import hre from 'hardhat';

import { getContractABI } from '../contracts';
import { API_BASE_URL } from '../constants/aws';
import { BALANCE_MANAGER_CONTRACT_NAME } from '../constants/contracts';

async function parseInputData(input: BytesLike) {
  const abi = getContractABI('mainnet', BALANCE_MANAGER_CONTRACT_NAME);
  const iface = new hre.ethers.Interface(abi);
  const inputData = await iface.decodeFunctionData('deposit', input);
  return hre.ethers.formatEther(inputData[0]);
}

export async function handleDepositConfirmation(tx: any) {
  const amount = await parseInputData(tx.input);
  const body = JSON.stringify({
    amount,
    address: tx.from.toLowerCase(),
    nonce: tx.nonce,
    tx_hash: tx.hash,
  });
  console.log('body', body);
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/deposit?secret=${config.get('secret')}`, {
      method: 'POST',
      body,
    });
    console.log('response', response);
    if (!response.ok) throw new Error(response.statusText);
    return response;
  } catch (error) {
    console.error('error', error);
  }
}
