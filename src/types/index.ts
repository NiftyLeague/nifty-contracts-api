import { BytesLike } from 'ethers';
import type { Signer } from 'ethers';

export * from './metadata';
export * from './snapshot';
export type ContractName =
  | 'NiftyDegen'
  | 'NiftyLaunchComics'
  | 'NiftyItemL2'
  | 'NFTLToken'
  | 'HydraDistributor'
  | 'NiftyBurningComicsL2'
  | 'BalanceManager';

export type TargetNetwork = 'mainnet' | 'sepolia';

export type { Signer };

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
