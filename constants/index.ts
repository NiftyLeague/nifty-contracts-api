import { AddOptions } from 'ipfs-core-types/dist/src/root';

export const API_BASE_URL = 'https://odgwhiwhzb.execute-api.us-east-1.amazonaws.com/prod';

export const CONTRACT_METHODS = {
  DEPOSIT: '0xb6b55f25',
  WITHDRAW: '0xfe55892d',
  PURCHASE: '0x72c9f580',
  RENAME: '0xc39cbef1',
  HYDRA_CLAIM: '0xb741465f',
};

export const DEGEN_CONTRACT_NAME = 'NiftyDegen';
export const COMICS_CONTRACT_NAME = 'NiftyLaunchComics';
export const ITEMS_CONTRACT_NAME = 'NiftyItemL2';
export const HYDRA_CLAIM_CONTRACT_NAME = 'HydraDistributor';

export const COLORIZE_OPTIONS = {
  pretty: true,
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
  },
};

// ipfs parameters for more deterministic CIDs
export const IPFS_OPTIONS = {
  cidVersion: 1,
  hashAlg: 'sha2-256',
  wrapWithDirectory: true,
} as AddOptions;
