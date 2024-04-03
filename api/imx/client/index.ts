import { config } from 'node-config-ts';
import { config as imx, x } from '@imtbl/sdk';
import type { TargetNetwork } from '../../types';
import { getWallet } from '../../utils/wallet';

const network = config.eth.network as TargetNetwork;

const { Environment, ImmutableConfiguration } = imx;

// #=============================================
// # IMX Client
// #=============================================

const { IMXClient, imxClientConfig } = x;

const environment = network === 'mainnet' ? Environment.PRODUCTION : Environment.SANDBOX;
export const imxClient = new IMXClient(imxClientConfig({ environment }));

// #=============================================
// # IMX Provider
// #=============================================

const { ProviderConfiguration, createStarkSigner, GenericIMXProvider, generateStarkPrivateKey } = x;

// Create Ethereum signer
const ethSigner = getWallet(network);

// Create STARK signer
const starkPrivateKey = generateStarkPrivateKey(); // Or retrieve previously generated key
const starkSigner = createStarkSigner(starkPrivateKey);

// Initialize provider
const providerConfig = new ProviderConfiguration({
  baseConfig: new ImmutableConfiguration({ environment }),
});

// @ts-expect-error - Wallet is assingable to Signer
export const imxProvider = new GenericIMXProvider(providerConfig, ethSigner, starkSigner);
