import colorize from 'json-colorizer';
import fs from 'fs';
import { ethers, BytesLike } from 'ethers';
import { MakeDegen } from './classes/degen';
import { TargetNetwork } from '../types';
import { DEGEN_CONTRACT_NAME } from '../constants';

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
  },
};

export async function handleNameChangeById(
  targetNetwork: TargetNetwork,
  tokenId: string
) {
  console.log(targetNetwork, tokenId);
  const minty = await MakeDegen(targetNetwork);
  const { exists, metadata } = await minty.checkTokenMetadataExists(tokenId);
  // if (exists) {
  //   console.log(`Updating Metadata for token id ${tokenId}:`);
  //   const { newMetadata } = await minty.updateTokenName(tokenId, metadata);
  //   console.log('');
  //   console.log('Updated NFT Metadata:');
  //   console.log(colorize(JSON.stringify(newMetadata), colorizeOptions));
  //   return { metadata: newMetadata };
  // }
}

async function getIdFromInput(input: BytesLike) {
  const abi = JSON.parse(
    fs.readFileSync(`./contracts/${DEGEN_CONTRACT_NAME}.abi.json`, {
      encoding: 'utf8',
    })
  );
  const iface = new ethers.utils.Interface(abi);
  const inputData = await iface.decodeFunctionData('changeName', input);
  const tokenId = inputData[0].toNumber();
  return tokenId;
}

export async function handleNameChangeByInput(
  targetNetwork: TargetNetwork,
  input: BytesLike
) {
  const tokenId = await getIdFromInput(input);
  return handleNameChangeById(targetNetwork, tokenId);
}
