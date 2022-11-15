import dotenv from 'dotenv';
dotenv.config();

const config = {
  host: {
    prod: 'https://api.niftyleague.com',
    staging: 'https://niftyleague-dev.herokuapp.com/',
  },
  port: process.env.PORT || 5000,
  secret: process.env.BE_API_SECRET,

  blocknative: {
    apiKey: {
      comics: process.env.BLOCKNATIVE_API_KEY_COMICS,
      degens: process.env.BLOCKNATIVE_API_KEY_DEGENS,
      p2e: process.env.BLOCKNATIVE_API_KEY_P2E,
    },
    webhookSecret: process.env.WEBHOOK_SECRET,
  },

  hardhat: {
    defaultNetwork: process.env.HARDHAT_NETWORK,
    infura: process.env.INFURA_PROJECT_ID,
    etherscan: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
