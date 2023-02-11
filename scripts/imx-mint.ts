import hre from 'hardhat';
import fs from 'fs';
import { JsonRpcProvider, Log, TransactionResponse } from '@ethersproject/providers';
import { Result } from '@ethersproject/abi';

import { mint } from '../imx-mint/minting/minting';
import { getEnv } from '../imx-mint/libs/utils';
import Config from '../imx-mint/minting/config';
import { TargetNetwork } from '../types';
import { getTxReceipt } from './utils/txReceipt';

const NIFTY_BURNING_COMICS_L2 = JSON.parse(
  fs.readFileSync('./contracts/NiftyBurningComicsL2.abi.json', {
    encoding: 'utf8',
  }),
);

function parseTopics(log: Log, eventName: string) {
  const iface = new hre.ethers.utils.Interface(NIFTY_BURNING_COMICS_L2);
  const inputData = iface.decodeEventLog(eventName, log.data, log.topics);
  return inputData;
}

function proceedIMXMint(targetNetwork: TargetNetwork, topics: Result, isKey: boolean) {
  const config = Config(targetNetwork);
  const by = topics[0];
  // const tokenIds = topics[1];
  const values = topics[2];
  const startIds = topics[3];

  if (isKey) {
    const ids: string[] = [];
    for (let i = 0; i < values.toNumber(); i++) {
      ids.push('' + (startIds.toNumber() + i));
    }
    // key itemId: 7
    mint(targetNetwork, config.item_addr, by, ids, '7');
  } else {
    for (let i = 0; i < values.length; i++) {
      const ids: string[] = [];
      for (let j = 0; j < values[i].toNumber(); j++) {
        ids.push('' + (startIds[i].toNumber() + j));
      }
      // item itemId: 1 - 6
      mint(targetNetwork, config.item_addr, by, ids, `${i + 1}`);
    }
  }
}

export async function handleIMXMint(tx: TransactionResponse, targetNetwork: TargetNetwork) {
  const providerUrl = `https://${targetNetwork}.infura.io/v3/${getEnv('INFURA_PROJECT_ID')}`;
  const provider = new JsonRpcProvider(providerUrl);
  const receipt = await getTxReceipt(provider, tx);
  if (receipt.logs.length > 3) {
    // key, item both
    proceedIMXMint(targetNetwork, parseTopics(receipt.logs[2], 'KeyMinted'), true);
    proceedIMXMint(targetNetwork, parseTopics(receipt.logs[3], 'ItemMinted'), false);
  } else {
    // item only
    proceedIMXMint(targetNetwork, parseTopics(receipt.logs[2], 'ItemMinted'), false);
  }
}
