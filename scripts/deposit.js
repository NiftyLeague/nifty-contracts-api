const { ethers } = require('hardhat');
const config = require('getconfig');
const fs = require('fs');
const fetch = require('node-fetch');
const { API_BASE_URL } = require('../constants');

const BALANCE_MANAGER_ABI = JSON.parse(
  fs.readFileSync('./contracts/BalanceManager.abi.json', {
    encoding: 'utf8',
  })
);

async function parseInputData(input) {
  const iface = new ethers.utils.Interface(BALANCE_MANAGER_ABI);
  const inputData = await iface.decodeFunctionData('deposit', input);
  return ethers.utils.formatEther(inputData[0]);
}

async function handleDepositConfirmation(tx) {
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
      `${API_BASE_URL}/accounts/deposit?secret=${config.secret}`,
      {
        method: 'POST',
        body,
      }
    );
    console.log('response', response);
    if (!response.ok) throw new Error(response.statusText);
    const json = await response.json();
    console.log('json', json);
  } catch (error) {
    console.error('error', error);
  }
}

module.exports = { handleDepositConfirmation };
