import { config } from 'node-config-ts';
import { ImmutableXClient, UpdateMetadataSchemaByNameParams, MetadataTypes } from '@imtbl/imx-sdk';
import { parse } from 'ts-command-line-args';
import type { Signer, TargetNetwork } from '../../types';
import { getWallet } from '../../utils/wallet';

const network = config.eth.network as TargetNetwork;

(async (): Promise<void> => {
  console.group('IMX-UPDATE-COLLECTION-METADATA-SCHEMA');
  const { collection, client } = config.imx[network];
  const collectionContractAddress = collection.contractAddress;

  const { name } = parse<{ name: string }>({
    name: {
      type: String,
      alias: 'n',
      description: 'Name of the metadata property you want to update',
    },
  });

  const signer = getWallet<Signer>();
  const user = await ImmutableXClient.build({ ...client, signer });

  console.log(`Updating metadata schema for ${name}...`, collectionContractAddress);

  /**
   * Edit your values here
   */
  const params: UpdateMetadataSchemaByNameParams = {
    name: 'NEW_NAME',
    type: MetadataTypes.Enum,
    filterable: false,
  };

  const message = await user.updateMetadataSchemaByName(name, collectionContractAddress, params);

  console.log(`✅ Updated metadata schema for ${name}.`);
  console.log(`Run 'npm run admin:get-metadata-schema' to see updated schema.`);
  console.log(JSON.stringify(message, null, 2));
  console.groupEnd();
})().catch(e => {
  console.error(e);
  console.groupEnd();
  process.exit(1);
});
