import config from 'config';
import fetch from 'node-fetch';

export async function resolveCirculatingSupply(): Promise<string | null> {
  try {
    const secret = config.get('hardhat.etherscan');
    const contractaddress = '0x3c8d2fce49906e11e71cb16fa0ffeb2b16c29638';
    const supplyURI = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractaddress}&apikey=${secret}`;
    const supplyRes = await fetch(supplyURI, {});
    if (supplyRes.status < 400) {
      const { result: supply } = (await supplyRes.json()) as {
        result: string;
      };
      return supply;
    }
    return null;
  } catch (e) {
    return null;
  }
}
