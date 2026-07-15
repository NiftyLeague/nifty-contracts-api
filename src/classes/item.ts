import path from 'path';
import fs from 'fs';

import type { Metadata, TargetNetwork } from '@/types';
import { ITEMS_METADATA } from '@/constants/metadata/items';
import { ITEMS_CONTRACT_NAME } from '@/constants/contracts';
import { S3_MARKETPLACE_BUCKET } from '@/constants/aws';
import { ITEMS_IMAGES_CID } from '@/constants/ipfs';
import { getAssetPath } from '@/utils/assets';
import { makeGatewayURL } from '@/utils/uriHelpers';
import { Minty } from './minty';

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
   * @param {string} assetGatewayURL - IPFS Gateway URL for the NFT asset
   *
   * @typedef {object} CreateMetadataResult
   * @property {string} name - optional name to set in NFT metadata
   * @property {object} image - an ipfs:// URI for the NFT asset
   * @property {string} description - optional description to store in NFT metadata
   *
   * @returns {Promise<CreateMetadataResult>}
   */
  async makeItemMetadata(tokenId: number, assetGatewayURL: string) {
    const item = ITEMS_METADATA.find(i => i.id === Number(tokenId));
    if (!item) throw new Error(`Item ID ${tokenId} not found`);
    const metadata: Metadata = { ...item };
    metadata.image = assetGatewayURL;
    await this.uploadToS3(`metadata/${tokenId}.json`, JSON.stringify(metadata, null, 2), S3_MARKETPLACE_BUCKET);
    return metadata;
  }

  /**
   * Generate Item NFT from tokenId, uploading to local IPFS
   *
   * @param {number} tokenId - the unique ID of the new token
   *
   * @typedef {object} GenerateNFTResult
   * @property {string} tokenId - the unique ID of the new token
   * @property {object} metadata - the JSON metadata stored in IPFS and referenced by the token's metadata URI
   * @property {string} assetURI - an ipfs:// URI for the NFT asset
   * @property {string} assetGatewayURL - an HTTP gateway URL for the NFT asset
   *
   * @returns {Promise<GenerateNFTResult>}
   */
  async generateItem(tokenId: number) {
    const filePath = getAssetPath('items', `${tokenId}.gif`);
    const content = await fs.promises.readFile(filePath);
    const basename = path.basename(filePath);
    const { assetURI, assetGatewayURL } = await this.pinImage(`/items/${basename}`, content);
    await this.uploadToS3(`images/${basename}`, content, S3_MARKETPLACE_BUCKET);
    const metadata = await this.makeItemMetadata(tokenId, assetGatewayURL);

    return {
      tokenId,
      metadata,
      assetURI,
      assetGatewayURL,
    };
  }

  //////////////////////////////////////////////
  // -------- Update Nifty IMX Items
  //////////////////////////////////////////////

  /**
   * Update token metadata
   * @param {string|number} tokenId
   * @property {object} metadata
   *
   * @typedef {object} NameChangeInfo
   * @property {object} newMetadata
   * @returns {Promise<NameChangeInfo>}
   */
  async updateItemMetadata(tokenId: number) {
    const assetGatewayURL = makeGatewayURL(`ipfs://${ITEMS_IMAGES_CID}/items/${tokenId}.gif`);
    const newMetadata = await this.makeItemMetadata(tokenId, assetGatewayURL);
    return { newMetadata };
  }
}
