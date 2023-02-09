import {
  TRIBES,
  SKIN_COLORS,
  FUR_COLORS,
  EYE_COLORS,
  PUPIL_COLORS,
  HAIR,
  MOUTHS,
  BEARDS,
  TOPS,
  OUTERWEAR,
  PRINTS,
  BOTTOMS,
  FOOTWEAR,
  BELTS,
  HATS,
  EYEWEAR,
  PIERCINGS,
  WRISTS,
  HANDS,
  NECKWEAR,
  LEFT_ITEMS,
  RIGHT_ITEMS,
} from './traitNames';

export const API_BASE_URL =
  'https://odgwhiwhzb.execute-api.us-east-1.amazonaws.com/prod';

export const CONTRACT_METHODS = {
  DEPOSIT: '0xb6b55f25',
  WITHDRAW: '0xfe55892d',
  PURCHASE: '0x72c9f580',
  RENAME: '0xc39cbef1',
};

export const DEGEN_CONTRACT_NAME = 'NiftyDegen';
export const COMICS_CONTRACT_NAME = 'NiftyLaunchComics';

export const DEGEN_METADATA = {
  description: 'Original collection of your favorite 10k DEGENs 🎮',
  externalURL: 'https://nifty-league.com/degens',
};

export const CHARACTER_BACKGROUNDS = ['Common', 'Rare', 'Meta', 'Legendary'];

export const CHARACTER_TRAIT_TYPES = [
  'Tribe',
  'Skin Color',
  'Fur Color',
  'Eye Color',
  'Pupil Color',
  'Hair',
  'Mouth',
  'Beard',
  'Top',
  'Outerwear',
  'Print',
  'Bottom',
  'Footwear',
  'Belt',
  'Hat',
  'Eyewear',
  'Piercing',
  'Wrist',
  'Hands',
  'Neckwear',
  'Left Item',
  'Right Item',
];

export const TRAIT_VALUE_MAP: { [index: number]: string } = {
  ...TRIBES,
  ...SKIN_COLORS,
  ...FUR_COLORS,
  ...EYE_COLORS,
  ...PUPIL_COLORS,
  ...HAIR,
  ...MOUTHS,
  ...BEARDS,
  ...TOPS,
  ...OUTERWEAR,
  ...PRINTS,
  ...BOTTOMS,
  ...FOOTWEAR,
  ...BELTS,
  ...HATS,
  ...EYEWEAR,
  ...PIERCINGS,
  ...WRISTS,
  ...HANDS,
  ...NECKWEAR,
  ...LEFT_ITEMS,
  ...RIGHT_ITEMS,
};
