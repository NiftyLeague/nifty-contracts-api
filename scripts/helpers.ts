const fetch = require('node-fetch');
const https = require('https');

async function fetchMetadata(URI) {
  try {
    const response = await fetch(URI);
    if (response.status < 400) return response.json();
    return null;
  } catch (e) {
    return null;
  }
}

async function resolveDegenMetadata(req) {
  const { network, token_id } = req.params;
  const URI = `https://nifty-league.s3.amazonaws.com/degens/${network}/metadata/${token_id}.json`;
  return fetchMetadata(URI);
}

const pipeRequest = (url, res) =>
  https.get(url, getRes => {
    res.setHeader('content-type', getRes.headers['content-type']);
    getRes.pipe(res);
  });

// await sleep trick
// http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchMetadata, resolveDegenMetadata, pipeRequest, sleep };
