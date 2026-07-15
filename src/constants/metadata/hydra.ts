import type { Attribute, Rarity } from '@/types';
import { DEGEN_METADATA } from './degens';
import { HYDRA_EGG_IPFS } from '../ipfs';
import hydrasJson from './hydras.json' with { type: 'json' };

export const UNHATCHED_METADATA = {
  name: 'HYDRA',
  image: HYDRA_EGG_IPFS,
  ...DEGEN_METADATA.mainnet,
  attributes: [
    {
      trait_type: 'Background',
      value: '???',
    },
    {
      trait_type: 'Tribe',
      value: 'Hydra',
    },
    {
      trait_type: 'Hydra',
      value: 'Unhatched',
    },
  ],
};

export const HYDRA_ATTRIBUTES = hydrasJson as {
  [tokenId: string]: { rarity: Rarity; attributes: Attribute[] };
};
