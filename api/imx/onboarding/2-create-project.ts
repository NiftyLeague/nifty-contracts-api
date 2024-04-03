console.warn(
  'DEPRECATED! Please follow the guide at https://docs.immutable.com/docs/x/launch-collection/register-project/',
);

// import { config } from 'node-config-ts';
// import { CreateProjectParams, ImmutableXClient } from '@imtbl/imx-sdk';
// import type { TargetNetwork, Signer } from '../../types';
// import { getWallet } from '../../utils/wallet';

// const network = config.eth.network as TargetNetwork;

// (async (): Promise<void> => {
//   console.group('IMX-CREATE-PROJECT');
//   const { project, client, company } = config.imx[network];
//   const signer = getWallet<Signer>();

//   const user = await ImmutableXClient.build({ ...client, signer });

//   console.log('Creating project...');

//   /**
//    * Edit your values here
//    */
//   const params: CreateProjectParams = {
//     name: project.name,
//     company_name: company.name,
//     contact_email: company.contact,
//   };

//   let newProject;
//   try {
//     newProject = await user.createProject(params);
//   } catch (error) {
//     throw new Error(JSON.stringify(error, null, 2));
//   }

//   console.log(`✅ Created project with ID: ${newProject.id}`);
//   console.groupEnd();
// })().catch(e => {
//   console.error(`❌ ${e} - ${e.response?.data?.message}`);
//   console.groupEnd();
//   process.exit(1);
// });
