export type ContractName = 'NiftyDegen' | 'NiftyLaunchComics';

export type TargetNetwork = 'mainnet' | 'goerli';

export type Metadata = {};

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
