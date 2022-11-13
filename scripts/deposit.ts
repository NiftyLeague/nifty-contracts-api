import config from 'config';
import fetch from 'node-fetch';
import fs from 'fs';
import hre from 'hardhat';
import { API_BASE_URL } from '../constants';

const BALANCE_MANAGER_ABI = JSON.parse(
  fs.readFileSync('./contracts/BalanceManager.abi.json', {
    encoding: 'utf8',
  })
);

async function parseInputData(input: any) {
  const iface = new hre.ethers.utils.Interface(BALANCE_MANAGER_ABI);
  const inputData = await iface.decodeFunctionData('deposit', input);
  return hre.ethers.utils.formatEther(inputData[0]);
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
    const response = await fetch(
      `${API_BASE_URL}/accounts/deposit?secret=${config.get('secret')}`,
      {
        method: 'POST',
        body,
      }
    );
    console.log('response', response);
    if (!response.ok) throw new Error(response.statusText);
    return response;
  } catch (error) {
    console.error('error', error);
  }
}
