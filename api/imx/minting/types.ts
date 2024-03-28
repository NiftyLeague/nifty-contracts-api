import type { Signer } from 'ethers';

export interface IMXClientConfig {
  public_api_url: string;
  api_key?: string;
  signer?: Signer;
  gas_limit?: string;
  gas_price?: string;
  stark_contract_address?: string;
  registration_contract_address?: string;
  enable_debug?: boolean;
}
