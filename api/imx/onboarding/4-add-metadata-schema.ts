import { config } from 'node-config-ts';
import { AddMetadataSchemaToCollectionParams, ImmutableXClient, MetadataTypes } from '@imtbl/imx-sdk';
import type { Signer, TargetNetwork } from '@/types';
import { getWallet } from '@/utils/wallet';

const network = config.eth.network as TargetNetwork;

(async (): Promise<void> => {
  console.group('IMX-ADD-COLLECTION-METADATA-SCHEMA');
  const { collection, client } = config.imx[network];
  const collectionContractAddress = collection.contractAddress;

  const signer = getWallet<Signer>();
  const user = await ImmutableXClient.build({ ...client, signer });

  console.log('Adding metadata schema to collection...', collectionContractAddress);

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

  const newCollection = await user.addMetadataSchemaToCollection(collectionContractAddress, params);

  console.log('✅ Added metadata schema to collection', collectionContractAddress);
  console.log(JSON.stringify(newCollection, null, 2));
  console.groupEnd();
})().catch(e => {
  console.error(`❌ ${e} - ${e.response?.data?.message}`);
  console.groupEnd();
  process.exit(1);
});
