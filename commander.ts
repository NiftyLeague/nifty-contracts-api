#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

import { NFTInfo, TargetNetwork } from './api/types';

import { Command } from 'commander';
import chalk from 'chalk';
import colorize from 'json-colorizer';
import config from 'config';
import path from 'path';

import { COLORIZE_OPTIONS } from './api/constants/commandLine';
import { handleNameChangeById } from './api/utils/handleNameChange';
import alignOutput from './api/utils/alignOutput';
import handleMetadataUpdate from './api/utils/handleMetadataUpdate';
import refreshOpenSea from './api/utils/refreshOpenSea';
import { MakeDegen } from './api/classes/degen';
import { MakeItem } from './api/classes/item';
import { MakeComic } from './api/classes/comic';
import { sleep } from './api/utils/api';

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

  program.command('pin-item <token-id>').description('"pins" imx item metadata').action(pinItem);
  program.command('pin-items').description('"pins" imx items metadata').action(pinItems);

  program.command('update-imx').description('"update" imx items & comics metadata').action(updateIMX);

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
const TOTAL_DEGENS = 10000;
const START_INDEX = 1;
// const HYDRA_START_INDEX = 9901;

async function refreshDegen(tokenId: number) {
  await refreshOpenSea(targetNetwork, tokenId);
  await sleep(500);
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
  for (let i = START_INDEX; i < TOTAL_DEGENS; i++) {
    await updateDegen(i);
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

// ---- ITEMS

const TOTAL_ITEMS = 7;

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
  for (let i = 1; i <= TOTAL_ITEMS; i++) {
    await pinItem(i);
  }
}

async function updateItem(tokenId: number) {
  const minty = await MakeItem(targetNetwork);
  console.log(`⚠️  Updating Metadata for item tokenID:`, tokenId);
  const { newMetadata } = await minty.updateItemMetadata(tokenId);
  console.log('');
  console.log('Updated NFT Metadata:');
  console.log(colorize(JSON.stringify(newMetadata), COLORIZE_OPTIONS));
  return { metadata: newMetadata };
}

async function updateItems() {
  for (let i = 1; i <= TOTAL_ITEMS; i++) {
    await updateItem(i);
  }
}

// ---- Comics

const TOTAL_COMICS = 6;

async function updateComic(tokenId: number) {
  const minty = await MakeComic(targetNetwork);
  console.log(`⚠️  Updating Metadata for comic tokenID:`, tokenId);
  const { newMetadata } = await minty.updateComicMetadata(tokenId);
  console.log('');
  console.log('Updated NFT Metadata:');
  console.log(colorize(JSON.stringify(newMetadata), COLORIZE_OPTIONS));
  return { metadata: newMetadata };
}

async function updateComics() {
  for (let i = 1; i <= TOTAL_COMICS; i++) {
    await updateComic(i);
  }
}

// ---- IMX Collections

async function updateIMX() {
  await updateComics();
  await updateItems();
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
