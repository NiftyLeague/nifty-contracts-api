#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

import { NFTInfo, TargetNetwork } from './types';

import { Command } from 'commander';
import chalk from 'chalk';
import colorize from 'json-colorizer';
import config from 'config';
import path from 'path';

import { COLORIZE_OPTIONS } from './constants';
import { handleNameChangeById } from './scripts/handleNameChange';
import { MakeDegen } from './scripts/classes/degen';
import alignOutput from './scripts/utils/alignOutput';
import handleTraitCount from './scripts/handleTraitCount';
import refreshOpenSea from './scripts/utils/refreshOpenSea';

const targetNetwork = config.get('hardhat.defaultNetwork') as TargetNetwork;

async function main() {
  const program = new Command();

  program
    .command('refresh-degen <token-id>')
    .description('"refresh" degen images and metadata on OpenSea')
    .action(refreshDegen);

  program
    .command('refresh-degens')
    .description('"refresh" all degens images and metadata on OpenSea')
    .action(refreshAllDegens);

  program
    .command('rename-degen <token-id>')
    .description('"rename" degen from contract to metadata')
    .action(updateDegenName);

  program
    .command('rename-degens')
    .description('"rename" all degens from contract to metadata')
    .action(updateDegensNames);

  program.command('update-degen <token-id>').description('"update" nft metadata').action(updateDegen);

  program.command('update-degens').description('"update" all degens metadata').action(updateDegens);

  program
    .command('get-degen <token-id>')
    .description('get info about an NFT using its token ID')
    .option('-c, --creation-info', 'include the creator address and block number the NFT was minted')
    .action(getDegen);

  program.command('create-hydra <token-id>').description('"create" image and metadata for hydra').action(generateHydra);
  program.command('create-hydras').description('"create" image and metadata for all hydra').action(generateHydras);

  // The hardhat and getconfig modules both expect to be running from the root directory of the project,
  // so we change the current directory to the parent dir of this script file to make things work
  // even if you call minty from elsewhere
  const rootDir = path.join(__dirname, '..');
  process.chdir(rootDir);

  await program.parseAsync(process.argv);
}

//////////////////////////////////////////////
// -------- Command Action Functions
//////////////////////////////////////////////

// ---- DEGENS

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TOTAL_DEGENS_TESTNET = 7550;
const TOTAL_DEGENS = 9998;
const START_INDEX = 1;
const HYDRA_START_INDEX = 9901;

async function refreshDegen(tokenId: number) {
  await refreshOpenSea(targetNetwork, tokenId);
}

async function refreshAllDegens() {
  for (let i = START_INDEX; i <= TOTAL_DEGENS; i++) {
    await refreshDegen(i);
  }
}

async function updateDegenName(tokenId: number) {
  await handleNameChangeById(targetNetwork, tokenId);
}

async function updateDegensNames() {
  for (let i = START_INDEX; i <= TOTAL_DEGENS; i++) {
    await updateDegenName(i);
  }
}

async function updateDegen(tokenId: number) {
  await handleTraitCount(targetNetwork, tokenId);
}

async function updateDegens() {
  for (let i = START_INDEX; i < HYDRA_START_INDEX; i++) {
    await updateDegen(i);
  }
}

async function generateHydra(tokenId: number) {
  const minty = await MakeDegen(targetNetwork);
  const { exists } = await minty.checkTokenMetadataExists(tokenId);
  if (exists) {
    console.log(`Metadata already exists for token id ${tokenId}`);
    console.log(`Updating Metadata for token id: ${tokenId}`);
    const { newMetadata } = await minty.updateHydra(tokenId);
    console.log('');
    console.log('Updated Hydra Metadata:');
    console.log(colorize(JSON.stringify(newMetadata), COLORIZE_OPTIONS));
  } else {
    console.log(`Generating asset and metadata for token id ${tokenId}:`);
    const nft = (await minty.generateHydra(tokenId)) as NFTInfo;
    console.log('');
    alignOutput([
      ['Token ID:', chalk.green(`${nft.tokenId}`)],
      ['Asset Address:', chalk.blue(nft.assetURI || '')],
      ['Asset Gateway URL:', chalk.blue(nft.assetGatewayURL || '')],
    ]);
    console.log('NFT Metadata:');
    console.log(colorize(JSON.stringify(nft.metadata), COLORIZE_OPTIONS));
  }
  return;
}

async function generateHydras() {
  for (let i = HYDRA_START_INDEX; i <= TOTAL_DEGENS; i++) {
    await generateHydra(i);
  }
}

async function getDegen(tokenId: number, options: { creationInfo: any }) {
  const { creationInfo: fetchCreationInfo } = options;
  const minty = await MakeDegen(targetNetwork);
  const nft = (await minty.getNFT(tokenId, { fetchCreationInfo })) as NFTInfo;

  const output = [
    ['Token ID:', chalk.green(`${nft.tokenId}`)],
    ['Owner Address:', chalk.yellow(nft.ownerAddress || '')],
  ];
  if (nft.creationInfo) {
    output.push(['Creator Address:', chalk.yellow(nft.creationInfo.creatorAddress)]);
    output.push(['Block Number:', `${nft.creationInfo?.blockNumber}`]);
  }
  output.push(['Metadata Address:', chalk.blue(nft.metadataURI || '')]);
  output.push(['Metadata Gateway URL:', chalk.blue(nft.metadataGatewayURL || '')]);
  output.push(['Asset Address:', chalk.blue(nft.assetURI || 'N/A')]);
  output.push(['Asset Gateway URL:', chalk.blue(nft.assetGatewayURL || 'N/A')]);
  alignOutput(output);

  console.log('NFT Metadata:');
  console.log(colorize(JSON.stringify(nft.metadata), COLORIZE_OPTIONS));
}

// ---- main entry point when running as a script

// make sure we catch all errors
main()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
