import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import config from 'config';

const hardhatConfig: HardhatUserConfig = {
  defaultNetwork: config.get('hardhat.defaultNetwork'),
  solidity: '0.8.4',
  networks: {
    mainnet: {
      // url: `https://mainnet.infura.io/v3/${config.get('hardhat.infura')}`,
      url: `https://eth-mainnet.g.alchemy.com/v2/${config.get('hardhat.alchemy')}`,
    },
    sepolia: {
      // url: `https://sepolia.infura.io/v3/${config.get('hardhat.infura')}`,
      url: `https://eth-sepolia.g.alchemy.com/v2/${config.get('hardhat.alchemy')}`,
    },
  },
};

export default hardhatConfig;
