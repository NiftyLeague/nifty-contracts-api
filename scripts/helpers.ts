import fetch from 'node-fetch';
import https from 'https';

export async function fetchMetadata(URI: any) {
  try {
    const response = await fetch(URI, {});
    if (response.status < 400) return response.json();
    return null;
  } catch (e) {
    return null;
  }
}

export async function resolveDegenMetadata(req: any) {
  const { network, token_id } = req.params;
  const URI = `https://nifty-league.s3.amazonaws.com/degens/${network}/metadata/${token_id}.json`;
  return fetchMetadata(URI);
}

export const pipeRequest = (url: any, res: any) =>
  https.get(url, (getRes: any) => {
    res.setHeader('content-type', getRes.headers['content-type']);
    getRes.pipe(res);
  });

// await sleep trick
// http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
export function sleep(ms: any) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
