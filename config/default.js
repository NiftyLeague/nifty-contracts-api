const config = {
  host: 'https://api.niftyleague.com',

  blocknative: {
    apiKey: '$$BLOCKNATIVE_API_KEY',
    webhookSecret: '$$WEBHOOK_SECRET',
  },

  hardhat: {
    defaultNetwork: '$$HARDHAT_NETWORK',
    infura: '$$INFURA_PROJECT_ID',
  },
};

module.exports = config;
