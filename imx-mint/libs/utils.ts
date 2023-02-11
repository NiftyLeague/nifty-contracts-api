import fs from 'fs';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';

export const NIFTY_BURNING_COMICS_L2_ABI = JSON.parse(
  fs.readFileSync('./contracts/NiftyBurningComicsL2.abi.json', {
    encoding: 'utf8',
  }),
);

export function getEnv(name: string, defaultValue: string | undefined = undefined): string {
  const value = process.env[name];

  if (value !== undefined) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Environment variable '${name}' not set`);
}

export function requireEnvironmentVariable(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Please ensure a value exists for ${key}`);
  }
  return value;
}

export function validateString<T extends string>(val: string, validValues: readonly string[]): T {
  const res = validValues.indexOf(val);
  if (res < 0) {
    throw Error(`${val} is not one of ${validValues}`);
  }
  return val as T;
}

export async function getItemIdByTokenId(tokenId: string): Promise<string> {
  const providerUrl = `https://${getEnv('HARDHAT_NETWORK')}.infura.io/v3/${getEnv('INFURA_PROJECT_ID')}`;
  const provider = new JsonRpcProvider(providerUrl);
  const contract = new Contract(getEnv('NIFTY_BURNING_COMICS_L2'), NIFTY_BURNING_COMICS_L2_ABI, provider);
  const itemId = await contract['itemIdByTokenId'](tokenId);

  // fix if itemId is zero
  if (itemId == 0) {
    // find the non-zero itemId in the previous tokenIds and replace zero with it
    let prevTokenId = Number(tokenId);
    let prevItemId;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      prevTokenId -= 1;
      prevItemId = await contract['itemIdByTokenId'](prevTokenId);

      if (prevItemId != 0) {
        return prevItemId.toString();
      }
    }
  }
  return itemId.toString();
}
