import colorize from 'json-colorizer';
import { COLORIZE_OPTIONS } from '../constants';
import { TargetNetwork } from '../types';
import { MakeDegen } from './classes/degen';

export default async function handleTraitCount(
  targetNetwork: TargetNetwork,
  tokenId: number
) {
  const minty = await MakeDegen(targetNetwork);
  const { exists, metadata } = await minty.checkTokenMetadataExists(tokenId);
  if (exists) {
    console.log(`Updating Metadata for token id ${tokenId}:`);
    const { newMetadata } = await minty.updateTokenTraitCount(
      tokenId,
      metadata
    );
    console.log('');
    console.log('Updated NFT Metadata:');
    console.log(colorize(JSON.stringify(newMetadata), COLORIZE_OPTIONS));
    return { metadata: newMetadata };
  }
}
