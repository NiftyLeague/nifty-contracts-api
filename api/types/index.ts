import { BytesLike } from 'ethers';
import type { ImmutableXClientParams } from '@imtbl/imx-sdk';
export type ContractName =
  | 'NiftyDegen'
  | 'NiftyLaunchComics'
  | 'NiftyItemL2'
  | 'NFTLToken'
  | 'HydraDistributor'
  | 'NiftyBurningComicsL2'
  | 'BalanceManager';

export type TargetNetwork = 'mainnet' | 'sepolia';

// TODO: remove temp Ethers v5 Signer reference
export type Signer = NonNullable<ImmutableXClientParams['signer']>;

export type ChainId = '1' | '11155111';

export type Rarity = '???' | 'Common' | 'Rare' | 'Meta' | 'Legendary' | 'Mythic';

export type Attribute = { trait_type?: string; value: string };

export type Metadata = {
  name: string;
  image: string;
  description: string;
  external_url: string;
  animation_url?: string;
  attributes: Attribute[];
};

export type CreationInfo = { blockNumber: number; creatorAddress: string };

export type NFTInfo = {
  tokenId: string | number;
  metadata: Metadata;
  metadataURI?: string;
  metadataGatewayURL?: string;
  ownerAddress?: string;
  assetURI?: string;
  assetGatewayURL?: string;
  assetDataBase64?: string;
  creationInfo?: CreationInfo;
};

export type InternalTransactions = {
  type: string;
  from: string;
  to: string;
  input: BytesLike;
  gas: number;
  gasUsed: number;
  value: string;
  contractCall?: {
    contractType: string;
    contractAddress: string;
    methodName: string;
    params: {
      _from: string;
      _to: string;
      _tokenId: string;
      _data: string;
    };
    contractAlias: string;
    contractName: string;
  };
};
