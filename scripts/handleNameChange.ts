import colorize from 'json-colorizer';
import fs from 'fs';
import config from 'config';
import { ethers } from 'hardhat';
import { MakeMinty } from './classes/minty';
import { TargetNetwork } from '../types';
import { BytesLike } from 'ethers';

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
  const minty = await MakeMinty(targetNetwork);
  const { exists, metadata } = await minty.checkTokenMetadataExists(tokenId);
  if (exists) {
    console.log(`Updating Metadata for token id ${tokenId}:`);
    const { newMetadata } = await minty.updateTokenName(tokenId, metadata);
    console.log('');
    console.log('Updated NFT Metadata:');
    console.log(colorize(JSON.stringify(newMetadata), colorizeOptions));
    return { metadata: newMetadata };
  }
}

async function getIdFromInput(input: BytesLike) {
  const abi = JSON.parse(
    fs.readFileSync(
      `./contracts/${config.get('hardhat.nftContractName')}.abi.json`,
      {
        encoding: 'utf8',
      }
    )
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
