const { ethers } = require('hardhat');
const { utils } = require('web3');
const fs = require('fs');
const { API_BASE_URL } = require('../constants');

const BALANCE_MANAGER_ABI = JSON.parse(
  fs.readFileSync('./contracts/BalanceManager.abi.json', {
    encoding: 'utf8',
  })
);

// await sleep trick
// http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get Transaction Receipt given tx hash
 */
async function getTxReceipt(tx) {
  while (true) {
    let receipt = await ethers.provider.getTransactionReceipt(tx);
    if (receipt && receipt.logs) {
      console.log('TX RECEIPT', receipt);
      return receipt;
    }
    console.log('Waiting for mined block to include your trasaction...');
    await sleep(4000);
  }
}

/**
 * Get NFT Token ID given tx hash
 */
async function getTokenIdFromTxReceipt(tx) {
  const receipt = await getTxReceipt(tx);
  const topics = receipt.logs[0].topics;
  return utils.hexToNumber(topics[3]);
}

async function parseInputData(input) {
  const iface = new ethers.utils.Interface(BALANCE_MANAGER_ABI);
  const inputData = await iface.decodeFunctionData('deposit', input);
  return inputData;
  // const tokenId = inputData[0].toNumber();
  // return tokenId;
}

async function handleDepositConfirmation(tx) {
  const input = await parseInputData(tx.input);
  console.log('input', input);

  const receipt = await getTxReceipt(tx);
  console.log('receipt', receipt);

  //   const input = web3.utils.toAscii(tx.input);
  //   console.log('input', input);

  //   const input2 = web3.utils.hexToAscii(tx.input);
  //   console.log('input2', input2);

  const body = {
    amount: 1.1,
    address: tx.from.toLowerCase(),
    nonce: 'nonce',
    tx_hash: tx.hash,
  };
}

module.exports = { handleDepositConfirmation };
