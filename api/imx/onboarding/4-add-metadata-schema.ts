import { config } from 'node-config-ts';
import { AlchemyProvider, Wallet } from 'ethers';
import { ImLogger, WinstonLogger } from '@imtbl/imlogging';
import { AddMetadataSchemaToCollectionParams, ImmutableXClient, MetadataTypes } from '@imtbl/imx-sdk';

import { loggerConfig } from '../config/logging';

const provider = new AlchemyProvider(config.eth.network, config.eth.alchemy);
const log: ImLogger = new WinstonLogger(loggerConfig);

const component = '[IMX-ADD-COLLECTION-METADATA-SCHEMA]';

(async (): Promise<void> => {
  const privateKey = config.imx.owner.pk;
  const collectionContractAddress = config.imx.collection.contractAddress;

  const signer = new Wallet(privateKey).connect(provider);

  const user = await ImmutableXClient.build({
    ...config.imx.client,
    // @ts-expect-error - Wallet is assingable to Signer
    signer,
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
