import { getEnv } from "../libs/utils";
import env from "../config/client";

export = (network: string): any => {
  switch (network) {
    // Mainnet Configuration
    case "mainnet":
      return {
        comics_addr: "",
        imx_client_config: {
          public_api_url: "https://api.x.immutable.com/v1",
          stark_contract_address: "0x5FDCCA53617f4d2b9134B29090C87D01058e27e9",
          registration_contract_address:
            "0x72a06bf2a1CE5e39cBA06c0CAb824960B587d64c",
          gas_limit: "500000",
        },
        new_collection_metadata: {
          name: undefined, // new IMX collection name
          description: undefined, // new description for the collection
          icon_url: undefined, // new url for the collection icon
          metadata_api_url: undefined, // new API base url to retrieve the tokens metadata (according to the metadata schema)
          collection_image_url: undefined, // new url for the collection image/banner
        },
      };
    // Goerli Configuration
    case "goerli":
      return {
        item_addr: env.collectionContractAddress,
        imx_client_config: {
          public_api_url: "https://api.sandbox.x.immutable.com/v1",
          // public_api_url: "https://api.goerli.x.immutable.com/v1",
          stark_contract_address: env.client.starkContractAddress,
          registration_contract_address: env.client.registrationContractAddress,
          gas_limit: "300000",
        },
        new_collection_metadata: {
          name: "undefined", // new IMX collection name
          description: undefined, // new description for the collection
          icon_url: undefined, // new url for the collection icon
          metadata_api_url: undefined, // new API base url to retrieve the tokens metadata (according to the metadata schema)
          collection_image_url: undefined, // new url for the collection image/banner
        },
      };
    // any other network is not supported
    default:
      throw "unknown network " + network;
  }
};
