import { AddOptions } from 'ipfs-core-types/dist/src/root';

// ipfs parameters for more deterministic CIDs
export const IPFS_OPTIONS = {
  cidVersion: 1,
  hashAlg: 'sha2-256',
  wrapWithDirectory: true,
} as AddOptions;

// ipfs://bafybeih75ntopwuggljajz3p2y2mh2ylxfv6joqlbvo2wxtabxkxm6igaa/degens
export const DEGEN_IMAGES_CID = 'bafybeih75ntopwuggljajz3p2y2mh2ylxfv6joqlbvo2wxtabxkxm6igaa';

// ipfs://bafybeibvp55mrgovy3m63fun4xyaxrqrqbvxmbhhz66onls72y6vzahfgm/comics
export const COMICS_IMAGES_CID = 'bafybeibvp55mrgovy3m63fun4xyaxrqrqbvxmbhhz66onls72y6vzahfgm';

// ipfs://bafybeic2bpeuxnmv64ustvlhjj4r73vta4n5ijadnjzix6tbfq3vqfhtia/items
export const ITEMS_IMAGES_CID = 'bafybeic2bpeuxnmv64ustvlhjj4r73vta4n5ijadnjzix6tbfq3vqfhtia';
