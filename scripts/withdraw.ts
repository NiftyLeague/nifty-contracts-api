// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'ethers'.
const { ethers } = require('hardhat');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fs'.
const fs = require('fs');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fetch'.
const fetch = require('node-fetch');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'config'.
const config = require('getconfig');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'API_BASE_U... Remove this comment to see the full error message
const { API_BASE_URL } = require('../constants');

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'BALANCE_MA... Remove this comment to see the full error message
const BALANCE_MANAGER_ABI = JSON.parse(
  fs.readFileSync('./contracts/BalanceManager.abi.json', {
    encoding: 'utf8',
  })
);

async function parseInputData(input: any) {
  const iface = new ethers.utils.Interface(BALANCE_MANAGER_ABI);
  const inputData = await iface.decodeFunctionData('withdraw', input);
  return {
    amount: ethers.utils.formatEther(inputData[0]),
    nonce: inputData[1].toNumber(),
    expireAt: inputData[2],
    signature: inputData[3],
  };
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'handleWith... Remove this comment to see the full error message
async function handleWithdrawConfirmation(tx: any) {
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

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = { handleWithdrawConfirmation };
