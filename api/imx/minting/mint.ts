import type { Log, TransactionResponse, Result } from 'ethers';
import { JsonRpcProvider, Interface } from 'ethers';
import { config } from 'node-config-ts';

import type { TargetNetwork } from '../../types';
import { mint } from './minting';
import { getTxReceipt } from '../../utils/txReceipt';
import { COMICS_BURNER_CONTRACT_NAME } from '../../constants/contracts';
import { getContractABI } from '../../contracts';

function parseTopics(targetNetwork: TargetNetwork, log: Log, eventName: string) {
  const abi = getContractABI(targetNetwork, COMICS_BURNER_CONTRACT_NAME);
  const iface = new Interface(abi);
  const inputData = iface.decodeEventLog(eventName, log.data, log.topics);
  return inputData;
}

function proceedIMXMint(targetNetwork: TargetNetwork, topics: Result, isKey: boolean) {
  const itemAddress = config.imx.collection.contractAddress;
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
    mint(targetNetwork, itemAddress, by, ids, '7');
  } else {
    for (let i = 0; i < values.length; i++) {
      const ids: string[] = [];
      for (let j = 0; j < values[i].toNumber(); j++) {
        ids.push('' + (startIds[i].toNumber() + j));
      }
      // item itemId: 1 - 6
      mint(targetNetwork, itemAddress, by, ids, `${i + 1}`);
    }
  }
}

export async function handleIMXMint(tx: TransactionResponse, targetNetwork: TargetNetwork) {
  const providerUrl = `https://${targetNetwork}.infura.io/v3/${config.eth.infura}`;
  const provider = new JsonRpcProvider(providerUrl);
  const receipt = await getTxReceipt(provider, tx);
  if (receipt.logs.length > 3) {
    // key, item both
    proceedIMXMint(targetNetwork, parseTopics(targetNetwork, receipt.logs[2], 'KeyMinted'), true);
    proceedIMXMint(targetNetwork, parseTopics(targetNetwork, receipt.logs[3], 'ItemMinted'), false);
  } else {
    // item only
    proceedIMXMint(targetNetwork, parseTopics(targetNetwork, receipt.logs[2], 'ItemMinted'), false);
  }
}
