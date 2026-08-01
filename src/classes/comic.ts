import path from 'path'
import fs from 'fs'

import type { Metadata, TargetNetwork } from '@/types'
import { COMICS_METADATA } from '@/constants/metadata/comics'
import { COMICS_CONTRACT_NAME } from '@/constants/contracts'
import { S3_MARKETPLACE_BUCKET } from '@/constants/aws'
import { COMICS_IMAGES_CID } from '@/constants/ipfs'
import { getAssetPath } from '@/utils/assets'
import { makeGatewayURL } from '@/utils/uriHelpers'
import { Minty } from './minty'

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Comic>} a new instance of Minty, ready to mint NFTs.
 */
export async function MakeComic(targetNetwork: TargetNetwork) {
  const m = new Comic(targetNetwork, COMICS_CONTRACT_NAME)
  await m.init()
  return m
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
   * @param {string} assetGatewayURL - IPFS Gateway URL for the NFT asset
   *
   * @typedef {object} CreateMetadataResult
   * @property {string} name - optional name to set in NFT metadata
   * @property {object} image - an ipfs:// URI for the NFT asset
   * @property {string} description - optional description to store in NFT metadata
   *
   * @returns {Promise<CreateMetadataResult>}
   */
  async makeComicMetadata(tokenId: number, assetGatewayURL: string) {
    const comic = COMICS_METADATA.find((c) => c.id === Number(tokenId))
    if (!comic) throw new Error(`Comic ID ${tokenId} not found`)
    const metadata: Metadata = { ...comic }
    metadata.image = assetGatewayURL
    await this.uploadToS3(
      `metadata/${tokenId}.json`,
      JSON.stringify(metadata, null, 2),
      S3_MARKETPLACE_BUCKET
    )
    return metadata
  }

  /**
   * Generate Comic NFT from tokenId, uploading to local IPFS
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
  async generateComic(tokenId: number) {
    const filePath = getAssetPath('comics', `${tokenId}.png`)
    const content = await fs.promises.readFile(filePath)
    const basename = path.basename(filePath)
    const { assetURI, assetGatewayURL } = await this.pinImage(
      `/nifty-launch-comics/${basename}`,
      content
    )
    await this.uploadToS3(`images/${basename}`, content, S3_MARKETPLACE_BUCKET)
    const metadata = await this.makeComicMetadata(tokenId, assetGatewayURL)

    return {
      tokenId,
      metadata,
      assetURI,
      assetGatewayURL,
    }
  }

  //////////////////////////////////////////////
  // -------- Update Nifty Comics
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
  async updateComicMetadata(tokenId: number) {
    const assetGatewayURL = makeGatewayURL(`ipfs://${COMICS_IMAGES_CID}/comics/${tokenId}.png`)
    const newMetadata = await this.makeComicMetadata(tokenId, assetGatewayURL)
    return { newMetadata }
  }
}
