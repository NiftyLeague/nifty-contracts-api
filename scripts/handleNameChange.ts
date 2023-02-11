import colorize from 'json-colorizer';
import fs from 'fs';
import { ethers, BytesLike } from 'ethers';
import { MakeDegen } from './classes/degen';
import { TargetNetwork } from '../types';
import { COLORIZE_OPTIONS, DEGEN_CONTRACT_NAME } from '../constants';

export async function handleNameChangeById(targetNetwork: TargetNetwork, tokenId: string | number) {
  console.log(targetNetwork, tokenId);
  const degen = await MakeDegen(targetNetwork);
  const { exists, metadata } = await degen.checkTokenMetadataExists(tokenId);
  if (exists) {
    console.log(`Updating Metadata for token id ${tokenId}:`);
    const { newMetadata } = await degen.updateTokenName(tokenId, metadata);
    console.log('');
    console.log('Updated NFT Metadata:');
    console.log(colorize(JSON.stringify(newMetadata), COLORIZE_OPTIONS));
    return { metadata: newMetadata };
  }
}

async function getIdFromInput(input: BytesLike) {
  const abi = JSON.parse(
    fs.readFileSync(`./contracts/${DEGEN_CONTRACT_NAME}.abi.json`, {
      encoding: 'utf8',
    }),
  );
  const iface = new ethers.utils.Interface(abi);
  const inputData = await iface.decodeFunctionData('changeName', input);
  const tokenId = inputData[0].toNumber();
  return tokenId;
}

export async function handleNameChangeByInput(targetNetwork: TargetNetwork, input: BytesLike) {
  const tokenId = await getIdFromInput(input);
  return handleNameChangeById(targetNetwork, tokenId);
}
