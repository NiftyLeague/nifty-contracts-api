import { DEGEN_METADATA } from './degenMetadata';

export enum HydraClan {
  r = 'royalty',
  b = 'battalion',
  o = 'outlier',
  t = 'traditionalist',
  n = 'naked',
  s = 'shadowclan',
}

export const UNHATCHED_METADATA = {
  ...DEGEN_METADATA,
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
      value: 'unhatched',
    },
  ],
};
