import path from 'path';
import fs from 'fs';
import { AddOptions } from 'ipfs-core-types/dist/src/root';

import { TargetNetwork } from '../../types';
import { uploadToS3 } from '../utils/uploadToS3';
import { ensureIpfsUriPrefix, makeGatewayURL } from '../utils/uriHelpers';
import refreshOpenSea from '../utils/refreshOpenSea';
import { COMICS_CONTRACT_NAME } from '../../constants';
import { COMICS_S3_BUCKET } from '../../constants/aws';
import { Minty } from './minty';

// ipfs parameters for more deterministic CIDs
const ipfsOptions = {
  cidVersion: 1,
  hashAlg: 'sha2-256',
  wrapWithDirectory: true,
} as AddOptions;

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Comic>} a new instance of Minty, ready to mint NFTs.
 */
export async function MakeComic(targetNetwork: TargetNetwork) {
  const m = new Comic(targetNetwork, COMICS_CONTRACT_NAME);
  await m.init();
  return m;
}

/**
 * Minty is the main object responsible for storing NFT data and interacting with the smart contract.
 * Before constructing, make sure that the contract has been deployed
 *
 * Minty requires async initialization, so the Minty class (and its constructor) are not exported.
 * To make one, use the async {@link MakeComic} function.
 */
class Comic extends Minty {
  //////////////////////////////////////////////
  // -------- Generate Nifty Comics
  //////////////////////////////////////////////

  /**
   * Helper to construct metadata JSON for comic NFTs
   *
   * @param {number} tokenId - the unique ID of the new token
   * @param {string} assetURI - IPFS URI for the NFT asset
   *
   * @typedef {object} CreateMetadataResult
   * @property {string} name - optional name to set in NFT metadata
   * @property {object} image - an ipfs:// URI for the NFT asset
   * @property {string} description - optional description to store in NFT metadata
   *
   * @returns {Promise<CreateMetadataResult>}
   */
  async makeComicMetadata(tokenId: number, assetURI: string) {
    const metadata = {
      name: `COMIC #${tokenId}`,
      image: ensureIpfsUriPrefix(assetURI),
      description:
        'Nifty League Launch Comics!! 📚  Each comic is burnable for a wearable but you might want to keep a full collection for when you get to the Citadel...',
    };
    await uploadToS3(`metadata/${tokenId}.json`, JSON.stringify(metadata, null, 2), false, COMICS_S3_BUCKET);
    console.log('✅ Metadata uploaded to S3');
    return metadata;
  }

  /**
   * Generate Comic NFT from tokenId, uploading to local IPFS
   *
   * @param {number} tokenId - the unique ID of the new token
   *
   * @returns {Promise<GenerateNFTResult>}
   */
  async generateComic(tokenId: number) {
    if (this.ipfs) {
      const filePath = `./public/images/comics/${tokenId}.png`;
      const content = await fs.promises.readFile(filePath);
      const basename = path.basename(filePath);
      const imgPath = `/nifty-launch-comics/${basename}`;
      const { cid: assetCid } = await this.ipfs.add({ path: imgPath, content }, ipfsOptions);
      console.log('✅ Image pinned to IPFS');

      await uploadToS3(`images/${basename}`, content, false, COMICS_S3_BUCKET);
      console.log('✅ Image uploaded to S3');

      // make the NFT metadata JSON
      const assetURI = ensureIpfsUriPrefix(assetCid) + imgPath;
      const metadata = await this.makeComicMetadata(tokenId, assetURI);

      await refreshOpenSea(this.targetNetwork, tokenId, this.contractName);
      console.log('✅ OpenSea force refresh triggered');

      return {
        tokenId,
        metadata,
        assetURI,
        assetGatewayURL: makeGatewayURL(assetURI),
      };
    }
    return null;
  }
}
