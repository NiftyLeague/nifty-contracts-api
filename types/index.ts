export type ContractName = 'NiftyDegen' | 'NiftyLaunchComics';

export type TargetNetwork = 'mainnet' | 'goerli';

export type Attribute = { trait_type: string; value: string };

export type Metadata = {
  name: string;
  image: string;
  description: string;
  external_url: string;
  attributes: Attribute[];
};

export type CreationInfo = { blockNumber: number; creatorAddress: any };

export type NFTInfo = {
  tokenId: string;
  metadata: Metadata;
  metadataURI: string;
  metadataGatewayURL: string;
  ownerAddress: string;
  assetURI?: string;
  assetGatewayURL?: string;
  assetDataBase64: string;
  creationInfo?: CreationInfo;
};
