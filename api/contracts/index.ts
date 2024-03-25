import { ethers } from 'hardhat';
import type { Contract } from 'ethers';
import type { TargetNetwork, ContractName } from '../types';
import MAINNET_DEPLOYMENTS from './deployments.mainnet';
import TESTNET_DEPLOYMENTS from './deployments.sepolia';

export const getDeployedContract = (targetNetwork: TargetNetwork, contractName: ContractName) => {
  const deployments = targetNetwork === 'mainnet' ? MAINNET_DEPLOYMENTS : TESTNET_DEPLOYMENTS;
  return deployments.contracts[contractName];
};

export const getContractAddress = (targetNetwork: TargetNetwork, contractName: ContractName) => {
  return getDeployedContract(targetNetwork, contractName).address as `0x${string}`;
};

export const getContractABI = (targetNetwork: TargetNetwork, contractName: ContractName) => {
  return getDeployedContract(targetNetwork, contractName).abi;
};

/**
 * Get NFT contract initialized with ABI & target address
 */
export async function getContractFactory(targetNetwork: TargetNetwork, contractName: ContractName): Promise<Contract> {
  const { address, abi } = getDeployedContract(targetNetwork, contractName);
  const contract = await ethers.getContractAt(abi as unknown as any[], address);
  await contract.deployed();
  return contract;
}
