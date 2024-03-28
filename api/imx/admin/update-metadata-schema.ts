import { config } from 'node-config-ts';
import { AlchemyProvider, Wallet } from 'ethers';
import { ImLogger, WinstonLogger } from '@imtbl/imlogging';
import { ImmutableXClient, UpdateMetadataSchemaByNameParams, MetadataTypes } from '@imtbl/imx-sdk';
import { parse } from 'ts-command-line-args';

import { loggerConfig } from '../config/logging';

const provider = new AlchemyProvider(config.eth.network, config.eth.alchemy);
const log: ImLogger = new WinstonLogger(loggerConfig);

const component = '[IMX-UPDATE-COLLECTION-METADATA-SCHEMA]';

(async (): Promise<void> => {
  const privateKey = config.imx.owner.pk;
  const collectionContractAddress = config.imx.collection.contractAddress;

  const { name } = parse<{ name: string }>({
    name: {
      type: String,
      alias: 'n',
      description: 'Name of the metadata property you want to update',
    },
  });

  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);

  const user = await ImmutableXClient.build({
    ...config.imx.client,
    // @ts-expect-error - Wallet is assingable to Signer
    signer,
  });

  log.info(component, `Updating metadata schema for ${name}`, collectionContractAddress);

  /**
   * Edit your values here
   */
  const params: UpdateMetadataSchemaByNameParams = {
    name: 'NEW_NAME',
    type: MetadataTypes.Enum,
    filterable: false,
  };

  const message = await user.updateMetadataSchemaByName(name, collectionContractAddress, params);

  log.info(
    component,
    `Update metadata schema for ${name}. Run 
    'npm run admin:get-metadata-schema' to see updated schema`,
  );
  console.log(JSON.stringify(message, null, 2));
})().catch(e => {
  log.error(component, e);
  process.exit(1);
});
