import { config } from 'node-config-ts';
import { AlchemyProvider, Wallet } from 'ethers';
import { ImLogger, WinstonLogger } from '@imtbl/imlogging';
import { CreateCollectionParams, ImmutableXClient } from '@imtbl/imx-sdk';

import { loggerConfig } from '../config/logging';

const provider = new AlchemyProvider(config.eth.network, config.eth.alchemy);
const log: ImLogger = new WinstonLogger(loggerConfig);

const component = '[IMX-CREATE-COLLECTION]';

(async (): Promise<void> => {
  const privateKey = config.imx.owner.pk;
  const collectionContractAddress = config.imx.collection.contractAddress;
  const projectId = config.imx.collection.projectId;

  const signer = new Wallet(privateKey).connect(provider);

  const user = await ImmutableXClient.build({
    ...config.imx.client,
    // @ts-expect-error - Wallet is assingable to Signer
    signer,
  });

  log.info(component, 'Creating collection...', collectionContractAddress);

  /**
   * Edit your values here
   */
  const params: Array<CreateCollectionParams> = [
    {
      name: config.imx.collection.name,
      description: config.imx.collection.description,
      contract_address: config.imx.collection.contractAddress,
      owner_public_key:
        '0x0484d92185c9a413c46f91dcfbdc430e8a5c8dbd7e363205135a5fccdd781233dc4c865903ead42e69fdcda3a3ffa23e504ec627f03e6f68da10196c1955eb9db6',
      icon_url: 'https://cdn.madskullz.io/madskullz/images/5359.png',
      metadata_api_url: `${config.host[config.eth.network]}/imx/items/metadata`,
      collection_image_url: 'https://cdn.madskullz.io/madskullz/images/1000.png',
      project_id: parseInt(projectId, 10),
    },
  ];

  let collection;
  try {
    for (let i = 0; i < params.length; i++) collection = await user.createCollection(params[i]);
  } catch (error) {
    throw new Error(JSON.stringify(error, null, 2));
  }

  log.info(component, 'Created collection');
  console.log(JSON.stringify(collection, null, 2));
})().catch(e => {
  log.error(component, e);
  process.exit(1);
});
