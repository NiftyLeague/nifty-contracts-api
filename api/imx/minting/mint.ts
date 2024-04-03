import { ImmutableXClient, ImmutableMethodResults } from '@imtbl/imx-sdk';
import type { Log, TransactionResponse, Result } from 'ethers';
import { JsonRpcProvider, Interface } from 'ethers';
import { config } from 'node-config-ts';

import type { Signer, TargetNetwork } from '@/types';
import { getTxReceipt } from '@/utils/txReceipt';
import { COMICS_BURNER_CONTRACT_NAME } from '@/constants/contracts';
import { getContractABI } from '@/contracts';
import { getWallet } from '@/utils/wallet';

async function get_imx_client(network: TargetNetwork): Promise<ImmutableXClient> {
  const { client } = config.imx[network];
  const signer = getWallet<Signer>(network);
  return ImmutableXClient.build({ ...client, signer });
}

function parseTopics(targetNetwork: TargetNetwork, log: Log, eventName: string): Result {
  const abi = getContractABI(targetNetwork, COMICS_BURNER_CONTRACT_NAME);
  const iface = new Interface(abi);
  const inputData = iface.decodeEventLog(eventName, log.data, log.topics);
  return inputData;
}

async function mint(
  targetNetwork: TargetNetwork,
  contractAddress: string,
  to: string,
  tokenIds: string[],
  itemId: string,
): Promise<ImmutableMethodResults.ImmutableOffchainMintV2Result | undefined> {
  if (tokenIds.length === 0) return;
  // Get configuration for the network
  const client = await get_imx_client(targetNetwork);

  console.log('Minting on L2...');
  const tokens = tokenIds.map(x => ({ id: x.toString(), blueprint: itemId }));
  const mint_result = await client.mintV2([
    {
      users: [{ etherKey: to, tokens }],
      contractAddress,
    },
  ]);
  console.log(`✅ Minting of tokenId(s) ${tokenIds} for collection ${contractAddress.toLowerCase()} successful!`);

  return mint_result.results[0];
}

function proceedIMXMint(targetNetwork: TargetNetwork, topics: Result, isKey: boolean) {
  const network = config.eth.network as TargetNetwork;
  const itemAddress = config.imx[network].collection.contractAddress;
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
