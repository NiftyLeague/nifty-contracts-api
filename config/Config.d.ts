/* tslint:disable */
/* eslint-disable */
declare module 'node-config-ts' {
  interface IConfig {
    host: Host;
    port: string;
    secret: string;
    blocknative: Blocknative;
    eth: Eth;
    imx: Imx;
    imageGenerator: ImageGenerator;
    s3: S3;
    ipfs: Ipfs;
  }
  interface Ipfs {
    authorization: string;
    protocol: string;
    host: string;
    port: number;
    path: string;
    gatewayURL: string;
    pinata: Pinata;
  }
  interface Pinata {
    pinataApiKey: string;
    pinataSecretApiKey: string;
  }
  interface S3 {
    bucket: string;
    clientConfig: ClientConfig;
  }
  interface ClientConfig {
    region: string;
    credentials: Credentials;
  }
  interface Credentials {
    accessKeyId: string;
    secretAccessKey: string;
  }
  interface ImageGenerator {
    baseURL: string;
    secret: string;
    version: string;
  }
  interface Imx {
    client: Client;
    owner: Owner;
    company: Company;
    project: Project;
    collection: Collection;
  }
  interface Collection {
    contractAddress: string;
    name: string;
    description: string;
    projectId: string;
  }
  interface Project {
    name: string;
  }
  interface Company {
    name: string;
    contact: string;
  }
  interface Owner {
    address: string;
    publicKey: string;
    pk: string;
  }
  interface Client {
    publicApiUrl: string;
    starkContractAddress: string;
    registrationContractAddress: string;
    gasLimit: string;
    gasPrice: string;
    enableDebug: boolean;
  }
  interface Eth {
    pk: string;
    network: string;
    infura: string;
    etherscan: string;
    alchemy: string;
    opensea: string;
  }
  interface Blocknative {
    apiKey: ApiKey;
    webhookSecret: string;
  }
  interface ApiKey {
    comics: string;
    degens: string;
    p2e: string;
  }
  interface Host {
    mainnet: string;
    sepolia: string;
  }
  export const config: Config;
  export type Config = IConfig;
}
