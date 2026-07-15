// ipfs parameters for more deterministic CIDs
export const IPFS_OPTIONS = {
  cidVersion: 1 as const,
  hashAlg: 'sha2-256',
  wrapWithDirectory: true,
};

// ipfs://bafybeih75ntopwuggljajz3p2y2mh2ylxfv6joqlbvo2wxtabxkxm6igaa/degens
export const DEGEN_IMAGES_CID = 'bafybeih75ntopwuggljajz3p2y2mh2ylxfv6joqlbvo2wxtabxkxm6igaa';

// ipfs://bafybeibvp55mrgovy3m63fun4xyaxrqrqbvxmbhhz66onls72y6vzahfgm/comics
export const COMICS_IMAGES_CID = 'bafybeibvp55mrgovy3m63fun4xyaxrqrqbvxmbhhz66onls72y6vzahfgm';

// ipfs://bafybeiagvxj6bpixng77msfbasmvthgjri2cpoxkgj4xwvhfspi5omywsm/items
export const ITEMS_IMAGES_CID = 'bafybeiagvxj6bpixng77msfbasmvthgjri2cpoxkgj4xwvhfspi5omywsm';

export const HYDRA_EGG_IPFS = 'ipfs://bafybeicawvt3acmrrenmesvflib73xbfihexncseybcljuruwtr44hzca4/nifty-degens/egg.mp4';

export const RUGMAN_IMAGE_IPFS = `ipfs://${DEGEN_IMAGES_CID}/degens/9999.png`;
export const SATOSHI_IMAGE_IPFS = `ipfs://${DEGEN_IMAGES_CID}/degens/10000.png`;
