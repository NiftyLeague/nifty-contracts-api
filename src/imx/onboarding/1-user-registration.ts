import { config } from 'node-config-ts';
import { ImmutableXClient } from '@imtbl/imx-sdk';
import type { TargetNetwork, Signer } from '@/types';
import { getWallet } from '@/utils/wallet';

const network = config.eth.network as TargetNetwork;

(async (): Promise<void> => {
  console.group('IMX-USER-REGISTRATION');
  const { client } = config.imx[network];
  const signer = getWallet<Signer>();
  const user = await ImmutableXClient.build({ ...client, signer });

  console.log('Registering user...');

  let existingUser;
  let newUser;
  try {
    // Fetching existing user
    existingUser = await user.getUser({
      user: user.address,
    });
  } catch {
    try {
      // If user doesnt exist, create user
      newUser = await user.registerImx({
        etherKey: user.address,
        starkPublicKey: user.starkPublicKey,
      });
    } catch (error) {
      throw new Error(JSON.stringify(error, null, 2), { cause: error });
    }
  }

  if (existingUser) {
    console.log(`❌ User already exists ${user.address}:`);
  } else {
    console.log(`✅ User has been created ${user.address}:`);
  }
  console.log(JSON.stringify({ newUser, existingUser }, null, 2));
  console.groupEnd();
})().catch(e => {
  console.error(`❌ ${e} - ${e.response?.data?.message}`);
  console.groupEnd();
  process.exit(1);
});
