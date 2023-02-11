import { DEGEN_METADATA } from './degenMetadata';

export const RUGMAN_IMAGE_IPFS = '';

export const RUGMAN = {
  name: `Rugman`,
  image: RUGMAN_IMAGE_IPFS,
  description: DEGEN_METADATA.description,
  external_url: `${DEGEN_METADATA.externalURL}/9999`,
  attributes: [
    {
      trait_type: 'Background',
      value: 'Mythic',
    },
    {
      trait_type: 'Tribe',
      value: 'Rugman',
    },
  ],
};

export const SATOSHI_IMAGE_IPFS = '';

export const SATOSHI = {
  name: `Satoshi`,
  image: SATOSHI_IMAGE_IPFS,
  description: DEGEN_METADATA.description,
  external_url: `${DEGEN_METADATA.externalURL}/10000`,
  attributes: [
    {
      trait_type: 'Background',
      value: 'Mythic',
    },
    {
      trait_type: 'Tribe',
      value: 'Satoshi',
    },
  ],
};
