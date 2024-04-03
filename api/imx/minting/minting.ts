import { config } from 'node-config-ts';
import { ImmutableXClient, ImmutableMethodResults } from '@imtbl/imx-sdk';
import { Signer, type TargetNetwork } from '@/types';
import { getWallet } from '@/utils/wallet';

async function get_imx_client(network: TargetNetwork): Promise<ImmutableXClient> {
  const { client } = config.imx[network];
  const signer = getWallet<Signer>(network);
  return ImmutableXClient.build({ ...client, signer });
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
