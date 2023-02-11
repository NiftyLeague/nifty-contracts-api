import path from 'path';
import fs from 'fs';

import { Metadata, NFTInfo, TargetNetwork } from '../../types';
import refreshOpenSea from '../utils/refreshOpenSea';
import { ensureIpfsUriPrefix, makeGatewayURL } from '../utils/uriHelpers';
import { downloadImage, generateImageURL, raritySelector } from '../utils/imageGenerator';
import {
  CHARACTER_BACKGROUNDS,
  CHARACTER_TRAIT_TYPES,
  DEGEN_METADATA,
  TRAIT_VALUE_MAP,
} from '../../constants/degenMetadata';
import { DEGEN_CONTRACT_NAME, IPFS_OPTIONS } from '../../constants';
import { DEGENS_S3_BUCKET } from '../../constants/aws';
import { Minty } from './minty';
import { HYDRA_ATTRIBUTES, HYDRA_EGG_IPFS, UNHATCHED_METADATA } from '../../constants/hydraMetadata';

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Degen>} a new instance of Minty, ready to mint NFTs.
 */
export async function MakeDegen(targetNetwork: TargetNetwork) {
  const m = new Degen(targetNetwork, DEGEN_CONTRACT_NAME);
  await m.init();
  return m;
}

/**
 * Minty is the main object responsible for storing NFT data and interacting with the smart contract.
 * Before constructing, make sure that the contract has been deployed
 *
 * Minty requires async initialization, so the Minty class (and its constructor) are not exported.
 * To make one, use the async {@link MakeDegen} function.
 */
class Degen extends Minty {
  //////////////////////////////////////////////
  // ------ DEGEN NFT Generation
  //////////////////////////////////////////////

  /**
   * Adds NFT metadata and image to IPFS given asset data.
   *
   * @param {number} tokenId - the unique ID of the new token
   * @param {[]} traits - list of character traits from contract
   * @param {string} filepath - token image filepath
   * @param {Buffer|Uint8Array} content - a Buffer or UInt8Array of data (e.g. for an image)
   * @param {number} rarity - number of background rarity 0-3
   *
   * @typedef {object} GenerateNFTResult
   * @property {string} tokenId - the unique ID of the new token
   * @property {object} metadata - the JSON metadata stored in IPFS and referenced by the token's metadata URI
   * @property {string} assetURI - an ipfs:// URI for the NFT asset
   * @property {string} assetGatewayURL - an HTTP gateway URL for the NFT asset
   *
   * @returns {Promise<GenerateNFTResult>}
   */
  async uploadNFTFromAssetData(
    tokenId: number,
    traits: number[],
    filePath: string,
    content: Buffer | Uint8Array,
    rarity: number,
  ) {
    const basename = path.basename(filePath);

    // When you add an object to IPFS with a directory prefix in its path,
    // IPFS will create a directory structure for you. This is nice, because
    // it gives us URIs with descriptive filenames in them e.g.
    // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM/cat-pic.png' instead of
    // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM'
    const imgPath = `/nifty-degens/${basename}`;
    if (this.ipfs) {
      const { cid: assetCid } = await this.ipfs.add({ path: imgPath, content }, IPFS_OPTIONS);
      console.log('✅ Image pinned to IPFS');

      const s3Path = `${this.targetNetwork}/images/${basename}`;
      await this.uploadToS3(s3Path, content, DEGENS_S3_BUCKET);

      // make the NFT metadata JSON
      const assetURI = ensureIpfsUriPrefix(assetCid) + imgPath;
      const metadata = await this.makeNFTMetadata(tokenId, traits, rarity, assetURI);

      await refreshOpenSea(this.targetNetwork, tokenId);
      console.log('✅ OpenSea force refresh triggered');

      return {
        tokenId,
        metadata,
        assetURI,
        assetGatewayURL: makeGatewayURL(assetURI),
      };
    }
  }

  /**
   * Generate NFT from tokenId, uploading to local IPFS
   *
   * @param {number} tokenId - the unique ID of the new token
   *
   * @returns {Promise<GenerateNFTResult>}
   */
  async generateNFT(tokenId: number) {
    const traits = await this.getCharacterTraits(tokenId);
    const rarity = raritySelector(tokenId);
    const filePath = await this.generateImage(tokenId, traits, rarity);
    const content = await fs.promises.readFile(filePath);
    // Cleanup the local file
    return this.uploadNFTFromAssetData(tokenId, traits, filePath, content, rarity);
  }

  /**
   * Helper to generate image from character options
   *
   * @param {number} tokenId - the unique ID of the new token
   * @param {[]} traits - list of character traits from contract
   * @param {number} rarity - number of background rarity 0-3
   *
   * @returns {string} - NFT image filepath
   */
  // eslint-disable-next-line class-methods-use-this
  async generateImage(tokenId: number, traits: number[], rarity: number) {
    const filePath = `./public/images/${this.targetNetwork}/${tokenId}.${rarity < 3 ? 'png' : 'mp4'}`;
    const url = generateImageURL(traits, rarity, tokenId);
    console.log('🎮 Unity image url:', url);
    console.log('');
    await downloadImage(url, filePath);
    return filePath;
  }

  /**
   * Helper to construct metadata JSON for character NFTs
   *
   * @param {number} tokenId - the unique ID of the new token
   * @param {[]} traits - list of character traits from contract
   * @param {number} rarity - number of background rarity 0-3
   * @param {string} assetURI - IPFS URI for the NFT asset
   *
   * @typedef {object} CreateMetadataResult
   * @property {string} name - optional name to set in NFT metadata
   * @property {object} image - an ipfs:// URI for the NFT asset
   * @property {string} description - optional description to store in NFT metadata
   * @property {string} external_url - an HTTP gateway URL for the NFT asset
   * @property {string} background_color - optional image background color to store in NFT metadata
   * @property {string} attributes - optional attributes to store in NFT metadata
   *
   * @returns {Promise<CreateMetadataResult>}
   */
  async makeNFTMetadata(tokenId: number, traits: number[], rarity: number, assetURI: string) {
    const attributes = [{ trait_type: 'Background', value: CHARACTER_BACKGROUNDS[rarity] }];
    traits.forEach((trait, i) => {
      if (trait !== 0) {
        attributes.push({
          trait_type: CHARACTER_TRAIT_TYPES[i],
          value: TRAIT_VALUE_MAP[trait],
        });
      }
    });
    const metadata = {
      name: (await this.contract?.getName(tokenId)) || `DEGEN #${tokenId}`,
      image: ensureIpfsUriPrefix(assetURI),
      description: DEGEN_METADATA.description,
      external_url: `${DEGEN_METADATA.externalURL}/${tokenId}`,
      attributes,
    };
    const s3Path = `${this.targetNetwork}/metadata/${tokenId}.json`;
    await this.uploadToS3(s3Path, JSON.stringify(metadata, null, 2), DEGENS_S3_BUCKET);
    return metadata;
  }

  //////////////////////////////////////////////
  // ------ HYDRA NFT Generation
  //////////////////////////////////////////////

  /**
   * Helper to construct metadata JSON for character NFTs
   *
   * @param {number} tokenId - the unique ID of the new token
   *
   * @typedef {object} CreateMetadataResult
   * @property {string} name - optional name to set in NFT metadata
   * @property {object} image - an ipfs:// URI for the NFT asset
   * @property {string} description - optional description to store in NFT metadata
   * @property {string} external_url - an HTTP gateway URL for the NFT asset
   * @property {string} background_color - optional image background color to store in NFT metadata
   * @property {string} attributes - optional attributes to store in NFT metadata
   *
   * @returns {Promise<CreateMetadataResult>}
   */
  async makeNewHydraMetadata(tokenId: number) {
    const metadata = {
      name: `HYDRA #${tokenId}`,
      image: UNHATCHED_METADATA.image,
      description: UNHATCHED_METADATA.description,
      external_url: `${UNHATCHED_METADATA.externalURL}/${tokenId}`,
      attributes: UNHATCHED_METADATA.attributes,
    };
    const s3Path = `${this.targetNetwork}/metadata/${tokenId}.json`;
    await this.uploadToS3(s3Path, JSON.stringify(metadata, null, 2), DEGENS_S3_BUCKET);
    return metadata;
  }

  /**
   * Generate new Hydra from tokenId, uploading to S3
   *
   * @param {number} tokenId - the unique ID of the new token
   *
   * @returns {Promise<GenerateNFTResult>}
   */
  async generateHydra(tokenId: number): Promise<NFTInfo | null> {
    const filePath = './public/images/hydra/egg.mp4';
    const content = await fs.promises.readFile(filePath);
    const s3Path = `${this.targetNetwork}/images/${tokenId}.mp4`;
    await this.uploadToS3(s3Path, content, DEGENS_S3_BUCKET);
    const metadata = await this.makeNewHydraMetadata(tokenId);
    await refreshOpenSea(this.targetNetwork, tokenId);
    console.log('✅ OpenSea force refresh triggered');
    return {
      tokenId,
      metadata,
    };
  }

  //////////////////////////////////////////////
  // ------ DEGEN NFT Updates
  //////////////////////////////////////////////

  /**
   * Update token metadata with new name
   * @param {string|number} tokenId
   * @property {object} metadata
   *
   * @typedef {object} NameChangeInfo
   * @property {object} newMetadata
   * @returns {Promise<NameChangeInfo>}
   */
  async updateTokenName(tokenId: string | number, metadata: Metadata) {
    const name = await this.getName(tokenId);
    const newMetadata = { ...metadata, name: name || `DEGEN #${tokenId}` };
    const s3Path = `${this.targetNetwork}/metadata/${tokenId}.json`;
    await this.uploadToS3(s3Path, JSON.stringify(newMetadata, null, 2), DEGENS_S3_BUCKET);
    await refreshOpenSea(this.targetNetwork, tokenId);
    console.log('✅ OpenSea force refresh triggered');
    return { newMetadata };
  }

  /**
   * Update token metadata with new name
   * @param {string|number} tokenId
   * @property {object} metadata
   *
   * @typedef {object} NameChangeInfo
   * @property {object} newMetadata
   * @returns {Promise<NameChangeInfo>}
   */
  async updateTokenTraitCount(tokenId: number, metadata: Metadata) {
    const allTraits = await this.getCharacterTraits(tokenId);
    const extraTraits = allTraits.slice(5);
    const extraTraitCount = extraTraits.filter(t => t > 0).length;
    const newMetadata = { ...metadata };
    newMetadata.external_url = `https://app.niftyleague.com/degens/${tokenId}`;
    newMetadata.attributes = [
      ...newMetadata.attributes.filter(
        a => a.trait_type !== 'Extra Trait Count' && a.trait_type !== 'Generation' && a.value !== 'Naked Gang',
      ),
    ];
    if (extraTraitCount === 0) newMetadata.attributes.push({ value: 'Naked Gang' });
    const s3Path = `${this.targetNetwork}/metadata/${tokenId}.json`;
    await this.uploadToS3(s3Path, JSON.stringify(newMetadata, null, 2), DEGENS_S3_BUCKET);
    await refreshOpenSea(this.targetNetwork, tokenId);
    console.log('✅ OpenSea force refresh triggered');
    return { newMetadata };
  }

  /**
   * Update Hydra metadata on claim
   * @param {string|number} tokenId
   * @property {object} metadata
   *
   * @typedef {object} NameChangeInfo
   * @property {object} newMetadata
   * @returns {Promise<NameChangeInfo>}
   */
  async updateHydra(tokenId: string | number) {
    const hydra = HYDRA_ATTRIBUTES[tokenId];
    const { rarity, attributes } = hydra;
    // upload image to IPFS & S3
    let image = HYDRA_EGG_IPFS;
    if (this.ipfs) {
      const filePath = `./public/images/hydra/${tokenId}.${rarity === 'Legendary' ? 'mp4' : 'png'}`;
      const content = await fs.promises.readFile(filePath);
      const basename = path.basename(filePath);
      const imgPath = `/nifty-degens/${basename}`;
      const { cid: assetCid } = await this.ipfs.add({ path: imgPath, content }, IPFS_OPTIONS);
      console.log('✅ Image pinned to IPFS');
      const s3Path = `${this.targetNetwork}/images/${basename}`;
      await this.uploadToS3(s3Path, content, DEGENS_S3_BUCKET);
      const assetURI = ensureIpfsUriPrefix(assetCid) + imgPath;
      image = ensureIpfsUriPrefix(assetURI);
    }
    // generate new metadata & upload to S3
    const newMetadata = {
      name: (await this.contract?.getName(tokenId)) || `HYDRA #${tokenId}`,
      image: image,
      description: UNHATCHED_METADATA.description,
      external_url: `${UNHATCHED_METADATA.externalURL}/${tokenId}`,
      attributes: [
        {
          trait_type: 'Background',
          value: rarity,
        },
        {
          trait_type: 'Tribe',
          value: 'Hydra',
        },
        ...attributes,
      ],
    };
    const s3Path = `${this.targetNetwork}/metadata/${tokenId}.json`;
    await this.uploadToS3(s3Path, JSON.stringify(newMetadata, null, 2), DEGENS_S3_BUCKET);
    await refreshOpenSea(this.targetNetwork, tokenId);
    console.log('✅ OpenSea force refresh triggered');
    return { newMetadata };
  }

  //////////////////////////////////////////////
  // -------- Contract Calls
  //////////////////////////////////////////////

  /**
   * Get the name for a specific token.
   *
   * @param {string} tokenId - the id of an existing token
   * @returns {Promise<string>} - current name of token
   */
  async getName(tokenId: string | number): Promise<string> {
    return this.contract?.getName(tokenId);
  }

  /**
   * Get the name for a specific token.
   *
   * @param {number} tokenId - the id of an existing token
   * @returns {Promise<[number]>} - list of character traits
   */
  async getCharacterTraits(tokenId: number): Promise<number[]> {
    return this.contract?.getCharacterTraits(tokenId);
  }
}
