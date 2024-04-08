import fetch from 'node-fetch';
import https from 'https';
import type { Request, Response } from 'express';
import type { Metadata } from '@/types';

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
