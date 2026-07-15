import { DEGEN_METADATA } from './degens';
import { SATOSHI_IMAGE_IPFS } from '../ipfs';

export const SATOSHI = {
  name: 'Satoshi',
  image: SATOSHI_IMAGE_IPFS,
  description: DEGEN_METADATA.mainnet.description,
  external_url: `${DEGEN_METADATA.mainnet.externalURL}/10000`,
  attributes: [
    {
      trait_type: 'Background',
      value: 'Meta',
    },
    {
      trait_type: 'Tribe',
      value: 'Satoshi',
    },
    {
      trait_type: 'Skin Color',
      value: 'Gentle Doe',
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
      value: 'Brown Simple',
    },
    {
      trait_type: 'Top',
      value: 'Black Longsleeve',
    },
    {
      trait_type: 'Outerwear',
      value: `Satoshi's Samurai Dou Cuirass`,
    },
    {
      trait_type: 'Print',
      value: `Bitcoin`,
    },
    {
      trait_type: 'Bottom',
      value: `Satoshi's Samurai Kusazari Armor`,
    },
    {
      trait_type: 'Footwear',
      value: `Satoshi's Samurai Kegutsu Shoes`,
    },
    {
      trait_type: 'Belt',
      value: `Satoshi's Samurai Uwa-obi Belt`,
    },
    {
      trait_type: 'Hat',
      value: `Satoshi's Samurai Kabuto Helmet`,
    },
    {
      trait_type: 'Eyewear',
      value: `Satoshi's Glasses`,
    },
    {
      trait_type: 'Wrist',
      value: `Satoshi's Samurai Kote Armored Sleeves`,
    },
    {
      trait_type: 'Left Item',
      value: `Satoshi's Samurai Katana`,
    },
  ],
};
