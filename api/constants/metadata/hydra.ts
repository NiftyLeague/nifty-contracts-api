import fs from 'fs';
import type { Attribute, Rarity } from '@/types';
import { DEGEN_METADATA } from './degens';
import { HYDRA_EGG_IPFS } from '../ipfs';

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

const HYDRAS = fs.readFileSync('./api/constants/metadata/hydras.json', { encoding: 'utf8' });
export const HYDRA_ATTRIBUTES: { [tokenId: string]: { rarity: Rarity; attributes: Attribute[] } } = JSON.parse(HYDRAS);
