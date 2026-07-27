import MAINNET_DEPLOYMENTS from '../contracts/deployments.mainnet'
import TESTNET_DEPLOYMENTS from '../contracts/deployments.sepolia'

export const CONTRACT_METHODS = {
  DEPOSIT: '0xb6b55f25',
  WITHDRAW: '0xfe55892d',
  PURCHASE: '0x72c9f580',
  RENAME: '0xc39cbef1',
  HYDRA_CLAIM: '0xb741465f',
}

export const CHAIN_ID = {
  mainnet: 1,
  sepolia: 11155111,
}

export const NFTL_ADDRESS = {
  mainnet: MAINNET_DEPLOYMENTS.contracts.NFTLToken.address,
  sepolia: TESTNET_DEPLOYMENTS.contracts.NFTLToken.address,
}
export const NFTL_CONTRACT_NAME = 'NFTLToken'
export const DEGEN_CONTRACT_NAME = 'NiftyDegen'
export const COMICS_CONTRACT_NAME = 'NiftyLaunchComics'
export const ITEMS_CONTRACT_NAME = 'NiftyItemL2'
export const COMICS_BURNER_CONTRACT_NAME = 'NiftyBurningComicsL2'
export const HYDRA_CLAIM_CONTRACT_NAME = 'HydraDistributor'
export const BALANCE_MANAGER_CONTRACT_NAME = 'BalanceManager'
