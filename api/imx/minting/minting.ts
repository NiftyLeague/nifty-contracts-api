import { config } from 'node-config-ts';
import { AlchemyProvider, Wallet } from 'ethers';
import { ImmutableXClient, ImmutableMethodResults } from '@imtbl/imx-sdk';
import type { TargetNetwork } from '../../types';

function get_provider(network: string) {
  return new AlchemyProvider(network, config.eth.alchemy);
}

function get_wallet_from_private_key(network: string, private_key: string): Wallet {
  const provider = get_provider(network);

  return new Wallet(private_key, provider);
}

function get_wallet(network: string): Wallet {
  const private_key = config.eth.pk;
  if (private_key) {
    return get_wallet_from_private_key(network, private_key);
  }

  return get_wallet_from_private_key(network, '');
}

function get_imx_client(network: string) {
  return get_imx_client_from_wallet(get_wallet(network));
}

async function get_imx_client_from_wallet(wallet: Wallet): Promise<ImmutableXClient> {
  return ImmutableXClient.build({
    ...config.imx.client,
    // @ts-expect-error - Wallet is assingable to Signer
    signer: wallet,
  });
}

async function mint_L2(
  client: ImmutableXClient,
  asset_address: string,
  to: string,
  token_id: string[],
  blueprint: string,
): Promise<ImmutableMethodResults.ImmutableOffchainMintV2Result> {
  const tokens = token_id.map(x => ({ id: x.toString(), blueprint }));

  console.log('Minting on L2...');

  const mint_result = await client.mintV2([
    {
      users: [{ etherKey: to, tokens }],
      contractAddress: asset_address,
    },
  ]);

  console.log(`Minting of tokenId ${token_id} of collection ${asset_address.toLowerCase()} successful on L2`);

  return mint_result.results[0];
}

export async function mint(targetNetwork: TargetNetwork, addr: string, to: string, tokenIds: string[], itemId: string) {
  // Get configuration for the network
  const client = await get_imx_client(targetNetwork);
  if (tokenIds.length > 0) {
    await mint_L2(client, addr, to, tokenIds, itemId);
  }
}
