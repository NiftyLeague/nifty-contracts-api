import dotenv from 'dotenv';
dotenv.config();

const config = {
  host: {
    mainnet: 'https://api.niftyleague.com',
    goerli: 'https://niftyleague-dev.herokuapp.com',
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

  imageGenerator: {
    baseURL: process.env.UNITY_IMAGE_GENERATOR_BASE_URL,
    secret: process.env.UNITY_IMAGE_GENERATOR_SECRET,
    version: process.env.UNITY_IMAGE_GENERATOR_VERSION,
  },

  s3: {
    accessKeyId: process.env.S3_ACCESS_ID,
    secretAccessKey: process.env.S3_SECRET,
    bucket: 'nifty-league',
  },

  ipfs: {
    authorizationDEV: process.env.INFURA_AUTHORIZATION_DEV,
    authorizationPROD: process.env.INFURA_AUTHORIZATION_PROD,
    baseDirName: 'nifty-league',
    // Can use http for local IPFS node
    protocol: 'https',
    // For local IPFS nodes you can set this to http://localhost:5001
    host: 'ipfs.infura.io',
    // If you're running IPFS on a non-default port, update this URL. If you're using the IPFS defaults, you should be all set.
    port: '5001',
    // This default it already set by ipfs-http-client but can be updated if necessary
    path: 'api/v0',
    // If you're running the local IPFS gateway on a non-default port, or if you want to use a public gatway when displaying IPFS gateway urls, edit this.
    gatewayURL: 'https://ipfs.io/ipfs',
  },
};

export default config;
