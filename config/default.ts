// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'config'.
const config = {
  host: 'https://api.niftyleague.com',
  secret: '$$BE_API_SECRET',

  blocknative: {
    apiKey: {
      comics: '$$BLOCKNATIVE_API_KEY_COMICS',
      degens: '$$BLOCKNATIVE_API_KEY_DEGENS',
      p2e: '$$BLOCKNATIVE_API_KEY_P2E',
    },
    webhookSecret: '$$WEBHOOK_SECRET',
  },

  hardhat: {
    defaultNetwork: '$$HARDHAT_NETWORK',
    infura: '$$INFURA_PROJECT_ID',
  },
};

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = config;
