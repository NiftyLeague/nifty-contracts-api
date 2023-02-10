import path from 'path';
import fs from 'fs';
import { AddOptions } from 'ipfs-core-types/dist/src/root';

import { TargetNetwork } from '../../types';
import { uploadToS3 } from '../utils/uploadToS3';
import { ensureIpfsUriPrefix, makeGatewayURL } from '../utils/uriHelpers';
import { ITEMS_CONTRACT_NAME } from '../../constants';
import { ITEMS_S3_BUCKET } from '../../constants/aws';
import { ITEMS_METADATA } from '../../constants/itemsMetadata';
import { Minty } from './minty';

// ipfs parameters for more deterministic CIDs
const ipfsOptions = {
  cidVersion: 1,
  hashAlg: 'sha2-256',
  wrapWithDirectory: true,
} as AddOptions;

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Item>} a new instance of Minty, ready to mint NFTs.
 */
export async function MakeItem(targetNetwork: TargetNetwork) {
  const m = new Item(targetNetwork, ITEMS_CONTRACT_NAME);
  await m.init();
  return m;
}

/**
 * Minty is the main object responsible for storing NFT data and interacting with the smart contract.
 * Before constructing, make sure that the contract has been deployed
 *
 * Minty requires async initialization, so the Minty class (and its constructor) are not exported.
 * To make one, use the async {@link MakeItem} function.
 */
class Item extends Minty {
  //////////////////////////////////////////////
  // -------- Generate Nifty IMX Items
  //////////////////////////////////////////////

  /**
   * Helper to construct metadata JSON for item NFTs
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
  async makeItemMetadata(tokenId: number, assetURI: string) {
    const metadata = {
      ...ITEMS_METADATA[tokenId - 1],
      image_url: makeGatewayURL(assetURI),
    };
    await uploadToS3(`metadata/${tokenId}.json`, JSON.stringify(metadata, null, 2), false, ITEMS_S3_BUCKET);
    console.log('✅ Metadata uploaded to S3');
    return metadata;
  }

  /**
   * Generate Item NFT from tokenId, uploading to local IPFS
   *
   * @param {number} tokenId - the unique ID of the new token
   *
   * @returns {Promise<GenerateNFTResult>}
   */
  async generateItem(tokenId: number) {
    if (this.ipfs) {
      const filePath = `./public/images/items/${tokenId}.gif`;
      const content = await fs.promises.readFile(filePath);
      const basename = path.basename(filePath);
      const imgPath = `/items/${basename}`;

      const { cid: assetCid } = await this.ipfs.add({ path: imgPath, content }, ipfsOptions);
      console.log('✅ Image pinned to IPFS');

      await uploadToS3(`images/${basename}`, content, false, ITEMS_S3_BUCKET);
      console.log('✅ Image uploaded to S3');

      // make the NFT metadata JSON
      const assetURI = ensureIpfsUriPrefix(assetCid) + imgPath;
      const metadata = await this.makeItemMetadata(tokenId, assetURI);

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
