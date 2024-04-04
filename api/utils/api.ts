import { config } from 'node-config-ts';
import fetch from 'node-fetch';
import https from 'https';
import type { Request, Response } from 'express';
import type { Metadata, TargetNetwork } from '@/types';

const network = config.eth.network as TargetNetwork;

export async function fetchMetadata(URI: string): Promise<Metadata | null> {
  try {
    const response = await fetch(URI, {});
    if (response.status < 400) return response.json() as unknown as Metadata;
    return null;
  } catch (e) {
    return null;
  }
}

export async function resolveDegenMetadata(req: Request): Promise<Metadata | null> {
  const { network, token_id } = req.params;
  const URI = `https://nifty-league.s3.amazonaws.com/degens/${network}/metadata/${token_id}.json`;
  return fetchMetadata(URI);
}

export const pipeRequest = (url: string, res: Response) =>
  https.get(url, (getRes: any) => {
    res.setHeader('content-type', getRes.headers['content-type']);
    getRes.pipe(res);
    getRes.on('end', () => {
      res.end();
    });
  });

// await sleep trick
// http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getItemsRecursive(cursor: string | null = null, result = []): Promise<any[]> {
  const { collection, client } = config.imx[network];
  const assetsURL = `${client.publicApiUrl}/assets?collection=${
    collection.contractAddress
  }&order_by=updated_at&page_size=200${cursor ? `&cursor=${cursor}` : ''}`;
  const response = await fetch(assetsURL, {});
  const json = (await response.json()) as {
    result: never[];
    remaining?: boolean;
    cursor: string | null;
  };
  // add page to result array
  result = result.concat(json.result);
  // check is this the end
  if (!json.remaining) {
    // return result array
    return result;
  } else {
    // or use cursor and continue processing
    return getItemsRecursive(json.cursor, result);
  }
}
