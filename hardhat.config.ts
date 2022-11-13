import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import config from 'config';

const hardhatConfig: HardhatUserConfig = {
  defaultNetwork: config.get('hardhat.defaultNetwork'),
  solidity: '0.8.4',
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${config.get('hardhat.infura')}`,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${config.get('hardhat.infura')}`,
    },
  },
};

export default hardhatConfig;
