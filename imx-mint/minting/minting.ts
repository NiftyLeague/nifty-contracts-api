import { AlchemyProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { ImmutableXClient, ImmutableMethodResults } from "@imtbl/imx-sdk";
import { getEnv } from "../libs/utils";

import Config from "./config";

import { IMXClientConfig } from "./types";

function get_provider(network: string) {
  return new AlchemyProvider(network, getEnv("ALCHEMY_API_KEY"));
}

function get_wallet_from_private_key(
  network: string,
  private_key: string
): Wallet {
  const provider = get_provider(network);

  return new Wallet(private_key, provider);
}

function get_wallet(network: string): Wallet {
  const private_key = getEnv("OWNER_ACCOUNT_PRIVATE_KEY");
  if (private_key) {
    return get_wallet_from_private_key(network, private_key);
  }

  return get_wallet_from_private_key(network, "");
}

function get_imx_client(network: string) {
  const config = Config(network);

  return get_imx_client_from_wallet(
    get_wallet(network),
    config.imx_client_config
  );
}

async function get_imx_client_from_wallet(
  wallet: Wallet,
  imx_client_config: IMXClientConfig
): Promise<ImmutableXClient> {
  return ImmutableXClient.build({
    publicApiUrl: imx_client_config.public_api_url,
    starkContractAddress: imx_client_config.stark_contract_address,
    registrationContractAddress:
      imx_client_config.registration_contract_address,
    gasLimit: imx_client_config.gas_limit,
    gasPrice: imx_client_config.gas_price,
    signer: wallet,
  });
}

async function mint_L2(
  client: ImmutableXClient,
  asset_address: string,
  to: string,
  token_id: string[],
  blueprint: string
): Promise<ImmutableMethodResults.ImmutableOffchainMintV2Result> {
  const tokens = token_id.map((x) => ({ id: x.toString(), blueprint }));

  console.log("Minting on L2...");

  const mint_result = await client.mintV2([
    {
      users: [{ etherKey: to, tokens }],
      contractAddress: asset_address,
    },
  ]);

  console.log(
    `Minting of tokenId ${token_id} of collection ${asset_address.toLowerCase()} successful on L2`
  );

  return mint_result.results[0];
}

export async function mint(addr: string, to: string, tokenIds: string[], itemId: string) {
  const NETWORK = getEnv("HARDHAT_NETWORK")!;

  // Get configuration for the network
  const client = await get_imx_client(NETWORK);
  if (tokenIds.length > 0) {
    await mint_L2(client, addr, to, tokenIds, itemId);
  }
}
