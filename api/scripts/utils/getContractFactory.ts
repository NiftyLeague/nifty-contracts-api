import { ethers } from 'hardhat';
import fs from 'fs';
import { ContractName, TargetNetwork } from '../../types';
import { Contract } from 'ethers';

/**
 * Get NFT contract initialized with ABI & target address
 */
export default async function getContractFactory(
  targetNetwork: TargetNetwork,
  contractName: ContractName,
): Promise<Contract> {
  const abi = JSON.parse(
    fs.readFileSync(`./contracts/${contractName}.abi.json`, {
      encoding: 'utf8',
    }),
  );
  const addressPath = `./contracts/${contractName}.${targetNetwork}.address`;
  const address = fs.readFileSync(addressPath).toString();
  const contract = await ethers.getContractAt(abi, address);
  await contract.deployed();
  return contract;
}
