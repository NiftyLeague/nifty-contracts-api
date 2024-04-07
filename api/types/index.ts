import { BytesLike } from 'ethers';
import type { ImmutableXClientParams } from '@imtbl/imx-sdk';

export * from './metadata';
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
