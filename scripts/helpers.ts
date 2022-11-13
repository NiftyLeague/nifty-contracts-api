// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fetch'.
const fetch = require('node-fetch');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const https = require('https');

async function fetchMetadata(URI: any) {
  try {
    const response = await fetch(URI);
    if (response.status < 400) return response.json();
    return null;
  } catch (e) {
    return null;
  }
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'resolveDeg... Remove this comment to see the full error message
async function resolveDegenMetadata(req: any) {
  const { network, token_id } = req.params;
  const URI = `https://nifty-league.s3.amazonaws.com/degens/${network}/metadata/${token_id}.json`;
  return fetchMetadata(URI);
}

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'pipeReques... Remove this comment to see the full error message
const pipeRequest = (url: any, res: any) =>
  https.get(url, (getRes: any) => {
    res.setHeader('content-type', getRes.headers['content-type']);
    getRes.pipe(res);
  });

// await sleep trick
// http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'sleep'.
function sleep(ms: any) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = { fetchMetadata, resolveDegenMetadata, pipeRequest, sleep };
