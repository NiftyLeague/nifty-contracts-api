const config = {
  host: 'https://api.niftyleague.com',
  secret: '$$BE_API_SECRET',

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
