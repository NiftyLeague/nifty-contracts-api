import { config } from 'node-config-ts';
import fetch from 'node-fetch';
import { type BytesLike, formatEther, Interface } from 'ethers';
import { API_BASE_URL } from '@/constants/aws';
import { getContractABI } from '@/contracts';
import { BALANCE_MANAGER_CONTRACT_NAME } from '@/constants/contracts';

async function parseInputData(input: BytesLike) {
  const abi = getContractABI('mainnet', BALANCE_MANAGER_CONTRACT_NAME);
  const iface = new Interface(abi);
  const inputData = await iface.decodeFunctionData('withdraw', input);
  return {
    amount: formatEther(inputData[0]),
    nonce: inputData[1].toNumber(),
    expireAt: inputData[2],
    signature: inputData[3],
  };
}

export async function handleWithdrawConfirmation(tx: any) {
  const { signature, nonce } = await parseInputData(tx.input);
  const body = JSON.stringify({
    withdrawal_signature: signature,
    transfer_hash: tx.hash,
    nonce,
  });
  console.log('body', body);
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/withdraw-confirm?secret=${config.aws.apiSecret}`, {
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
