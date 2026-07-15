export type TokenBalance = { tokenId: string; balance: string };

export type TokenOwner = {
  ownerAddress: string;
  tokenBalances: TokenBalance[];
};

export type AlchemyOwnersResponse = {
  owners: TokenOwner[];
  pageKey: string | null;
};

export type HolderBalance = {
  address: string;
  ids: number[];
  values: number[];
};

export type Snapshot = HolderBalance[];
