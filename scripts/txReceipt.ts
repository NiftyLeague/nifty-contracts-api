// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'ethers'.
const { ethers } = require('hardhat');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const { utils } = require('web3');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'sleep'.
const { sleep } = require('./helpers');

/**
 * Get Transaction Receipt given tx hash
 */
async function getTxReceipt(tx: any) {
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
async function getTokenIdFromTxReceipt(tx: any) {
  const receipt = await getTxReceipt(tx);
  const topics = receipt.logs[0].topics;
  return utils.hexToNumber(topics[3]);
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = { getTxReceipt, getTokenIdFromTxReceipt };
