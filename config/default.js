const config = {
  host: 'https://api.niftyleague.com',
  secret: '$$BE_API_SECRET',

  blocknative: {
    apiKey: {
      p2e: '$$BLOCKNATIVE_API_KEY_P2E',
      comics: '$$BLOCKNATIVE_API_KEY_COMICS',
    },
    webhookSecret: '$$WEBHOOK_SECRET',
  },

  hardhat: {
    defaultNetwork: '$$HARDHAT_NETWORK',
    infura: '$$INFURA_PROJECT_ID',
  },
};

module.exports = config;
