import { config } from 'node-config-ts';
import { AlchemyProvider, Wallet } from 'ethers';
import { ImLogger, WinstonLogger } from '@imtbl/imlogging';
import { CreateProjectParams, ImmutableXClient } from '@imtbl/imx-sdk';

import { loggerConfig } from '../config/logging';

const provider = new AlchemyProvider(config.eth.network, config.eth.alchemy);
const log: ImLogger = new WinstonLogger(loggerConfig);

const component = '[IMX-CREATE-PROJECT]';

(async (): Promise<void> => {
  const privateKey = config.imx.owner.pk;
  const signer = new Wallet(privateKey).connect(provider);

  const user = await ImmutableXClient.build({
    ...config.imx.client,
    // @ts-expect-error - Wallet is assingable to Signer
    signer,
  });

  log.info(component, 'Creating project...');

  /**
   * Edit your values here
   */
  const params: CreateProjectParams = {
    name: config.imx.project.name,
    company_name: config.imx.company.name,
    contact_email: config.imx.company.contact,
  };

  let project;
  try {
    project = await user.createProject(params);
  } catch (error) {
    throw new Error(JSON.stringify(error, null, 2));
  }

  log.info(component, `Created project with ID: ${project.id}`);
})().catch(e => {
  log.error(component, e);
  process.exit(1);
});
