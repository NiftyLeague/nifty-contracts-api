// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'ethers'.
const { ethers } = require('hardhat');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'config'.
const config = require('getconfig');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fs'.
const fs = require('fs');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fetch'.
const fetch = require('node-fetch');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'API_BASE_U... Remove this comment to see the full error message
const { API_BASE_URL } = require('../constants');

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'BALANCE_MA... Remove this comment to see the full error message
const BALANCE_MANAGER_ABI = JSON.parse(
  fs.readFileSync('./contracts/BalanceManager.abi.json', {
    encoding: 'utf8',
  })
);

// @ts-expect-error TS(2393): Duplicate function implementation.
async function parseInputData(input: any) {
  const iface = new ethers.utils.Interface(BALANCE_MANAGER_ABI);
  const inputData = await iface.decodeFunctionData('deposit', input);
  return ethers.utils.formatEther(inputData[0]);
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'handleDepo... Remove this comment to see the full error message
async function handleDepositConfirmation(tx: any) {
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
    return response;
  } catch (error) {
    console.error('error', error);
  }
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = { handleDepositConfirmation };
