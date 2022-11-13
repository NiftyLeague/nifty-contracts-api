// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'fetch'.
const fetch = require('node-fetch');

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'resolveCir... Remove this comment to see the full error message
async function resolveCirculatingSupply() {
  try {
    // @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
    const secret = process.env.ETHERSCAN_API_KEY;
    const contractaddress = '0x3c8d2fce49906e11e71cb16fa0ffeb2b16c29638';
    const supplyURI = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractaddress}&apikey=${secret}`;
    const supplyRes = await fetch(supplyURI);
    if (supplyRes.status < 400) {
      const { result: supply } = await supplyRes.json();
      return supply;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = { resolveCirculatingSupply };
