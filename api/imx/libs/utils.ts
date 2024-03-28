import { Contract, JsonRpcProvider } from 'ethers';
import { config } from 'node-config-ts';
import { COMICS_BURNER_CONTRACT_NAME } from '../../constants/contracts';
import { getDeployedContract } from '../../contracts';
import type { TargetNetwork } from '../../types';

export async function getItemIdByTokenId(tokenId: string): Promise<string> {
  const targetNetwork = config.eth.network as TargetNetwork;
  const providerUrl = `https://${targetNetwork}.infura.io/v3/${config.eth.infura}`;
  const provider = new JsonRpcProvider(providerUrl);
  const { address, abi } = getDeployedContract(targetNetwork, COMICS_BURNER_CONTRACT_NAME);
  const contract = new Contract(address, abi, provider);
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
