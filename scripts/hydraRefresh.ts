import colorize from 'json-colorizer';
import { COLORIZE_OPTIONS } from '../constants';
import { InternalTransactions, TargetNetwork } from '../types';
import { MakeDegen } from './classes/degen';

export async function handleHydraRefreshById(targetNetwork: TargetNetwork, tokenId: string) {
  console.log(targetNetwork, tokenId);
  const minty = await MakeDegen(targetNetwork);
  const { exists, metadata } = await minty.checkTokenMetadataExists(tokenId);
  if (exists) {
    console.log(`Updating Metadata for token id ${tokenId}:`);
    const { newMetadata } = await minty.updateHydra(tokenId, metadata);
    console.log('');
    console.log('Updated Hydra Metadata:');
    console.log(colorize(JSON.stringify(newMetadata), COLORIZE_OPTIONS));
    return { metadata: newMetadata };
  }
}

async function getHydraIdFromInternalTxs(txs: InternalTransactions[]) {
  const hydraTransfer = txs[txs.length - 1];
  return hydraTransfer.contractCall?.params?._tokenId;
}

export async function handleHydraRefresh(
  targetNetwork: TargetNetwork,
  tx: { internalTransactions: InternalTransactions[] },
) {
  const tokenId = await getHydraIdFromInternalTxs(tx.internalTransactions);
  if (tokenId) return handleHydraRefreshById(targetNetwork, tokenId);
}
