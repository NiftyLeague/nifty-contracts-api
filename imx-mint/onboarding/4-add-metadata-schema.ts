import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { ImLogger, WinstonLogger } from '@imtbl/imlogging';
import { AddMetadataSchemaToCollectionParams, ImmutableXClient, MetadataTypes } from '@imtbl/imx-sdk';

import env from '../config/client';
import { loggerConfig } from '../config/logging';

const provider = new AlchemyProvider(env.ethNetwork, env.alchemyApiKey);
const log: ImLogger = new WinstonLogger(loggerConfig);

const component = '[IMX-ADD-COLLECTION-METADATA-SCHEMA]';

(async (): Promise<void> => {
  const privateKey = env.ownerAccountPrivateKey;
  const collectionContractAddress = env.collectionContractAddress;

  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);

  const user = await ImmutableXClient.build({
    ...env.client,
    signer,
    enableDebug: true,
  });

  log.info(component, 'Adding metadata schema to collection', collectionContractAddress);

  /**
   * Edit your values here
   */
  const params: AddMetadataSchemaToCollectionParams = {
    metadata: [
      {
        name: 'item_id',
        type: MetadataTypes.Continuous,
        filterable: false,
      },
      {
        name: 'name',
        type: MetadataTypes.Enum,
        filterable: true,
      },
      {
        name: 'type',
        type: MetadataTypes.Enum,
        filterable: true,
      },
      {
        name: 'tier',
        type: MetadataTypes.Enum,
        filterable: true,
      },
      {
        name: 'placement',
        type: MetadataTypes.Enum,
        filterable: true,
      },
      {
        name: 'image_url',
        type: MetadataTypes.Text,
        filterable: false,
      },
      {
        name: 'description',
        type: MetadataTypes.Text,
        filterable: false,
      },
    ],
  };

  const collection = await user.addMetadataSchemaToCollection(collectionContractAddress, params);

  log.info(component, 'Added metadata schema to collection', collectionContractAddress);
  console.log(JSON.stringify(collection, null, 2));
})().catch(e => {
  log.error(component, e);
  process.exit(1);
});
