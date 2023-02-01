import hre from 'hardhat';
import web3 from 'web3';
import { sleep } from './api';

/**
 * Get Transaction Receipt given tx hash
 */
export async function getTxReceipt(tx: any) {
  while (true) {
    const receipt = await hre.ethers.provider.getTransactionReceipt(tx);
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
export async function getTokenIdFromTxReceipt(tx: any) {
  const receipt = await getTxReceipt(tx);
  const topics = receipt.logs[0].topics;
  return web3.utils.hexToNumber(topics[3]);
}
