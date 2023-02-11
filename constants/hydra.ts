import { DEGEN_METADATA } from './degenMetadata';

export enum HydraClan {
  b = 'battalion',
  n = 'naked',
  o = 'outlier',
  r = 'royalty',
  s = 'shadowclan',
  t = 'traditionalist',
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
