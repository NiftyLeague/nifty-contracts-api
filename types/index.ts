export type ContractName = 'NiftyDegen' | 'NiftyLaunchComics' | 'NiftyItemL2';

export type TargetNetwork = 'mainnet' | 'goerli';

export type Attribute = { trait_type?: string; value: string };

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

export type InternalTransactions = {
  type: string;
  from: string;
  to: string;
  input: string;
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
