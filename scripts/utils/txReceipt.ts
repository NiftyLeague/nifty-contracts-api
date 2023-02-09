import { JsonRpcProvider } from '@ethersproject/providers';
import { sleep } from './api';

/**
 * Get Transaction Receipt given tx hash
 */
export async function getTxReceipt(provider: JsonRpcProvider, tx: any) {
  while (true) {
    const receipt = await provider.getTransactionReceipt(tx.hash);
    if (receipt && receipt.logs) {
      console.log('TX RECEIPT', receipt);
      return receipt;
    }
    console.log('Waiting for mined block to include your trasaction...');
    await sleep(4000);
  }
}
