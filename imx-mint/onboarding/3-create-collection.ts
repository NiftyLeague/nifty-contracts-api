import config from 'config';
import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { ImLogger, WinstonLogger } from '@imtbl/imlogging';
import { CreateCollectionParams, ImmutableXClient } from '@imtbl/imx-sdk';

import env from '../config/client';
import { loggerConfig } from '../config/logging';

const provider = new AlchemyProvider(env.ethNetwork, env.alchemyApiKey);
const log: ImLogger = new WinstonLogger(loggerConfig);

const component = '[IMX-CREATE-COLLECTION]';

(async (): Promise<void> => {
  const privateKey = env.ownerAccountPrivateKey;
  const collectionContractAddress = env.collectionContractAddress;
  const projectId = env.collectionProjectId;

  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);
  const ownerPublicKey = wallet.publicKey;

  const user = await ImmutableXClient.build({
    ...env.client,
    signer,
    enableDebug: true,
  });

  log.info(component, 'Creating collection...', collectionContractAddress);

  /**
   * Edit your values here
   */
  const params: Array<CreateCollectionParams> = [
    {
      name: env.collectionName,
      description: env.collectionDescription,
      contract_address: collectionContractAddress,
      owner_public_key:
        '0x0484d92185c9a413c46f91dcfbdc430e8a5c8dbd7e363205135a5fccdd781233dc4c865903ead42e69fdcda3a3ffa23e504ec627f03e6f68da10196c1955eb9db6',
      icon_url: 'https://cdn.madskullz.io/madskullz/images/5359.png',
      metadata_api_url: `${config.get(
        `host.${env.ethNetwork}`
      )}/imx/items/metadata`,
      collection_image_url:
        'https://cdn.madskullz.io/madskullz/images/1000.png',
      project_id: parseInt(projectId, 10),
    },
  ];

  let collection;
  try {
    for (let i = 0; i < params.length; i++)
      collection = await user.createCollection(params[i]);
  } catch (error) {
    throw new Error(JSON.stringify(error, null, 2));
  }

  log.info(component, 'Created collection');
  console.log(JSON.stringify(collection, null, 2));
})().catch(e => {
  log.error(component, e);
  process.exit(1);
});
