const fetch = require('node-fetch');

async function resolveCirculatingSupply() {
  try {
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

module.exports = { resolveCirculatingSupply };
