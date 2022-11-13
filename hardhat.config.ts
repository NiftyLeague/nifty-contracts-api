// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
require('dotenv').config();
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
require('@nomiclabs/hardhat-ethers');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'config'.
const config = require('getconfig');

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
  defaultNetwork: config.hardhat.defaultNetwork,
  solidity: '0.8.4',
  networks: {
    mainnet: { url: `https://mainnet.infura.io/v3/${config.hardhat.infura}` },
    goerli: { url: `https://goerli.infura.io/v3/${config.hardhat.infura}` },
  },
};
