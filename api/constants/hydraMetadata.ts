import fs from 'fs';
import { DEGEN_METADATA } from './degenMetadata';
import { Attribute, Rarity } from '@/types';

export enum HydraClan {
  b = 'Battalion',
  n = 'Naked',
  o = 'Outlier',
  r = 'Royalty',
  s = 'Shadowclan',
  t = 'Traditionalist',
}

export const HYDRA_EGG_IPFS = 'ipfs://bafybeicawvt3acmrrenmesvflib73xbfihexncseybcljuruwtr44hzca4/nifty-degens/egg.mp4';

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

const HYDRAS = fs.readFileSync('./api/constants/hydras.json', { encoding: 'utf8' });
export const HYDRA_ATTRIBUTES: { [tokenId: string]: { rarity: Rarity; attributes: Attribute[] } } = JSON.parse(HYDRAS);
