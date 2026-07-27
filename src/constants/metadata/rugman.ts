import { DEGEN_METADATA } from './degens'
import { RUGMAN_IMAGE_IPFS } from '../ipfs'

export const RUGMAN = {
  name: 'RugMan',
  image: RUGMAN_IMAGE_IPFS,
  description: DEGEN_METADATA.mainnet.description,
  external_url: `${DEGEN_METADATA.mainnet.externalURL}/9999`,
  attributes: [
    {
      trait_type: 'Background',
      value: 'Meta',
    },
    {
      trait_type: 'Tribe',
      value: 'Rugman',
    },
    {
      trait_type: 'Skin Color',
      value: 'Matterhorn',
    },
    {
      trait_type: 'Eye Color',
      value: 'White',
    },
    {
      trait_type: 'Pupil Color',
      value: 'River Styx',
    },
    {
      trait_type: 'Hair',
      value: `RugMan's Mane`,
    },
    {
      trait_type: 'Outerwear',
      value: `RugMan's Spiked Epaulettes`,
    },
    {
      trait_type: 'Bottom',
      value: `RugMan's Half Tabard`,
    },
    {
      trait_type: 'Footwear',
      value: `RugMan's Greaves`,
    },
    {
      trait_type: 'Belt',
      value: `RugMan's Champion Belt`,
    },
    {
      trait_type: 'Piercing',
      value: 'Gold Ring Trio',
    },
    {
      trait_type: 'Wrist',
      value: `RugMan's Steel Studded Cuffs`,
    },
    {
      trait_type: 'Left Item',
      value: `RugMan's Rugged Scythe`,
    },
  ],
}
