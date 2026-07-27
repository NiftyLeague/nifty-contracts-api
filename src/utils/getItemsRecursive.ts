import { config } from 'node-config-ts'
import fetch from 'node-fetch'
import type { TargetNetwork, Metadata } from '@/types'

const network = config.eth.network as TargetNetwork

interface ItemMetadata extends Metadata {
  item_id: number
  tier: string
  type: string
  image_url: string
}

type Item = {
  token_address: string
  token_id: string
  id: string
  user: string
  status: string
  uri: null
  name: string
  description: string
  image_url: string
  metadata: ItemMetadata
  collection: {
    name: string
    icon_url: string
  }
  created_at: string
  updated_at: string
}

type ItemsResponse = Item[]

export async function getItemsRecursive(
  cursor: string | null = null,
  result = []
): Promise<ItemsResponse> {
  const { collection, client } = config.imx[network]
  const assetsURL = `${client.publicApiUrl}/assets?collection=${
    collection.contractAddress
  }&order_by=updated_at&page_size=200${cursor ? `&cursor=${cursor}` : ''}`
  const response = await fetch(assetsURL, {})
  const json = (await response.json()) as {
    result: never[]
    remaining?: boolean
    cursor: string | null
  }
  // add page to result array
  result = result.concat(json.result)
  // check is this the end
  if (!json.remaining) {
    // return result array
    return result
  } else {
    // or use cursor and continue processing
    return getItemsRecursive(json.cursor, result)
  }
}
