const { ethers } = require('hardhat');
const fs = require('fs');
const fetch = require('node-fetch');
const config = require('getconfig');
const { API_BASE_URL } = require('../constants');

const BALANCE_MANAGER_ABI = JSON.parse(
  fs.readFileSync('./contracts/BalanceManager.abi.json', {
    encoding: 'utf8',
  })
);

async function parseInputData(input) {
  const iface = new ethers.utils.Interface(BALANCE_MANAGER_ABI);
  const inputData = await iface.decodeFunctionData('withdraw', input);
  return {
    amount: ethers.utils.formatEther(inputData[0]),
    nonce: inputData[1].toNumber(),
    expireAt: inputData[2],
    signature: inputData[3],
  };
}

async function handleWithdrawConfirmation(tx) {
  const { signature, nonce } = await parseInputData(tx.input);
  const body = JSON.stringify({
    withdrawal_signature: signature,
    transfer_hash: tx.hash,
    nonce,
  });
  console.log('body', body);
  try {
    const response = await fetch(
      `${API_BASE_URL}/accounts/withdraw-confirm?secret=${config.secret}`,
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

module.exports = { handleWithdrawConfirmation };
