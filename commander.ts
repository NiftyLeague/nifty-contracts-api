#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

import { NFTInfo, TargetNetwork } from './api/types';

import { Command } from 'commander';
import chalk from 'chalk';
import colorize from 'json-colorizer';
import config from 'config';
import path from 'path';

import { COLORIZE_OPTIONS } from './api/constants';
import { LEGGIES } from './api/constants/degenMetadata';
import { handleNameChangeById } from './api/scripts/handleNameChange';
import { MakeDegen } from './api/scripts/classes/degen';
import { MakeItem } from './api/scripts/classes/item';
import alignOutput from './api/scripts/utils/alignOutput';
import handleMetadataUpdate from './api/scripts/handleMetadataUpdate';
import refreshOpenSea from './api/scripts/utils/refreshOpenSea';

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

  program.command('pin-item <token-id>').description('"pins" imx item metadata').action(pinItem);
  program.command('pin-items').description('"pins" imx items metadata').action(pinItems);

  program.command('update-leggy <token-id>').description('"update" leggy image').action(updateLeggy);
  program.command('update-leggies').description('"update" leggies images').action(updateLeggies);

  program.command('create-mythics').description('"create" image and metadata for all hydra').action(generateMythics);

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
  await handleMetadataUpdate(targetNetwork, tokenId);
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
    console.log(`⚠️  Updating Metadata for token id: ${tokenId}`);
    const { newMetadata } = await minty.updateHydra(tokenId);
    console.log('');
    console.log('Updated Hydra Metadata:');
    console.log(colorize(JSON.stringify(newMetadata), COLORIZE_OPTIONS));
  } else {
    console.log(`⚠️  Generating asset and metadata for token id ${tokenId}:`);
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
async function generateMythic(tokenId: number) {
  const minty = await MakeDegen(targetNetwork);
  console.log(`⚠️  Generating asset and metadata for token id ${tokenId}:`);
  const nft = (await minty.generateMythic(tokenId)) as NFTInfo;
  console.log('');
  alignOutput([
    ['Token ID:', chalk.green(`${nft.tokenId}`)],
    ['Asset Address:', chalk.blue(nft.assetURI || '')],
    ['Asset Gateway URL:', chalk.blue(nft.assetGatewayURL || '')],
  ]);
  console.log('NFT Metadata:');
  console.log(colorize(JSON.stringify(nft.metadata), COLORIZE_OPTIONS));
  return;
}

async function generateMythics() {
  await generateMythic(9999);
  await generateMythic(10000);
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

async function updateLeggy(tokenId: number) {
  const minty = await MakeDegen(targetNetwork);
  const { metadata } = await minty.checkTokenMetadataExists(tokenId);
  console.log(`⚠️  Updating Image & Metadata for token id: ${tokenId}`);
  const { newMetadata } = await minty.updateLeggy(tokenId, metadata);
  console.log('');
  console.log('Updated Leggy Metadata:');
  console.log(colorize(JSON.stringify(newMetadata), COLORIZE_OPTIONS));
  return;
}

async function updateLeggies() {
  for (const id of LEGGIES) {
    await updateLeggy(id);
  }
}

// ---- ITEMS

async function pinItem(tokenId: number) {
  const minty = await MakeItem(targetNetwork);
  console.log(`⚠️  Generating asset and metadata for item id ${tokenId}:`);
  const nft = await minty.generateItem(tokenId);
  console.log('');
  alignOutput([
    ['Token ID:', chalk.green(`${nft.tokenId}`)],
    ['Asset Address:', chalk.blue(nft.assetURI)],
    ['Asset Gateway URL:', chalk.blue(nft.assetGatewayURL)],
  ]);
  console.log('NFT Metadata:');
  console.log(colorize(JSON.stringify(nft.metadata), COLORIZE_OPTIONS));
  return;
}

async function pinItems() {
  for (let i = 1; i <= 7; i++) {
    await pinItem(i);
  }
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
