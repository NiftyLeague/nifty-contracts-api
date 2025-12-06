export const DEFAULTS = {
  name: 'Nifty League Contracts API',
  description: 'Smart Contract API for Nifty League',
  version: '1.0.0',
};

export const getEndpoints = (baseUrl: string) => ({
  NFTL: {
    description: 'NFTL token supply information',
    routes: [
      {
        method: 'GET',
        path: '/NFTL/supply',
        description: 'Get circulating supply of NFTL (alias for /NFTL/supply/circulating)',
        example: `${baseUrl}/NFTL/supply`,
      },
      {
        method: 'GET',
        path: '/NFTL/supply/circulating',
        description: 'Get circulating supply of NFTL',
        example: `${baseUrl}/NFTL/supply/circulating`,
      },
      {
        method: 'GET',
        path: '/NFTL/supply/unclaimed',
        description: 'Get unclaimed supply of NFTL',
        example: `${baseUrl}/NFTL/supply/unclaimed`,
      },
      {
        method: 'GET',
        path: '/NFTL/supply/total',
        description: 'Get total supply of NFTL (circulating + unclaimed)',
        example: `${baseUrl}/NFTL/supply/total`,
      },
      {
        method: 'GET',
        path: '/NFTL/supply/max',
        description: 'Get maximum supply of NFTL (total + remaining emissions)',
        example: `${baseUrl}/NFTL/supply/max`,
      },
    ],
  },
  DEGENs: {
    description: 'DEGEN NFT endpoints',
    routes: [
      {
        method: 'GET',
        path: '/degens/burn-list',
        description: 'Get list of burned DEGEN token IDs',
        example: `${baseUrl}/degens/burn-list`,
      },
      {
        method: 'GET',
        path: '/:network/degen/metadata/:token_id',
        description: 'Get metadata for a DEGEN by token ID',
        parameters: {
          network: 'mainnet | sepolia',
          token_id: 'Token ID number',
        },
        example: `${baseUrl}/sepolia/degen/metadata/123`,
      },
      {
        method: 'GET',
        path: '/:network/degen/image/:token_id',
        description: 'Get image for a DEGEN by token ID',
        parameters: {
          network: 'mainnet | sepolia',
          token_id: 'Token ID number',
        },
        example: `${baseUrl}/sepolia/degen/image/123`,
      },
      {
        method: 'GET',
        path: '/:network/degen/:token_id/background',
        description: 'Get background attribute for a DEGEN by token ID',
        parameters: {
          network: 'mainnet | sepolia',
          token_id: 'Token ID number',
        },
        example: `${baseUrl}/sepolia/degen/123/background`,
      },
    ],
  },
  MARKETPLACE: {
    description: 'IMX Marketplace endpoints',
    routes: [
      {
        method: 'GET',
        path: '/imx/marketplace/collection.json',
        description: 'Get marketplace collection metadata',
        example: `${baseUrl}/imx/marketplace/collection.json`,
      },
      {
        method: 'GET',
        path: '/imx/marketplace/metadata/:token_id',
        description: 'Get metadata for a marketplace item by token ID',
        parameters: {
          token_id: 'Token ID number (supports .json suffix)',
        },
        example: `${baseUrl}/imx/marketplace/metadata/1`,
      },
      {
        method: 'GET',
        path: '/imx/marketplace/images/:token_id',
        description: 'Get image for a marketplace item by token ID',
        parameters: {
          token_id: 'Token ID number',
        },
        example: `${baseUrl}/imx/marketplace/images/1`,
      },
    ],
  },
  SNAPSHOTS: {
    description: 'Migration snapshot endpoints (DEPRECATED)',
    deprecated: true,
    routes: [
      {
        method: 'GET',
        path: '/imx/snapshot/comics',
        description: 'Get snapshot of comics holders',
        example: `${baseUrl}/imx/snapshot/comics`,
      },
      {
        method: 'GET',
        path: '/imx/snapshot/items',
        description: 'Get snapshot of items holders',
        example: `${baseUrl}/imx/snapshot/items`,
      },
      {
        method: 'GET',
        path: '/imx/snapshot/combined',
        description: 'Get combined snapshot of comics and items holders',
        example: `${baseUrl}/imx/snapshot/combined`,
      },
    ],
  },
  COMICS: {
    description: 'v1 Comics endpoints (DEPRECATED)',
    deprecated: true,
    routes: [
      {
        method: 'GET',
        path: '/imx/comics/metadata/:token_id',
        description: 'Get metadata for a comic by token ID',
        parameters: {
          token_id: 'Token ID number',
        },
        example: `${baseUrl}/imx/comics/metadata/1`,
      },
      {
        method: 'GET',
        path: '/imx/comics/image/:token_id',
        description: 'Get image for a comic by token ID',
        parameters: {
          token_id: 'Token ID number',
        },
        example: `${baseUrl}/imx/comics/image/1`,
      },
    ],
  },
  ITEMS: {
    description: 'v1 Items endpoints (DEPRECATED)',
    deprecated: true,
    routes: [
      {
        method: 'GET',
        path: '/imx/items/metadata/:token_id',
        description: 'Get metadata for an item by token ID',
        parameters: {
          token_id: 'Token ID number',
        },
        example: `${baseUrl}/imx/items/metadata/101`,
      },
      {
        method: 'GET',
        path: '/imx/items/image/:token_id',
        description: 'Get image for an item by token ID',
        parameters: {
          token_id: 'Token ID number',
        },
        example: `${baseUrl}/imx/items/image/101`,
      },
      {
        method: 'GET',
        path: '/imx/items',
        description: 'Get paginated list of items',
        queryParameters: {
          cursor: 'Optional pagination cursor',
        },
        example: `${baseUrl}/imx/items?cursor=abc123`,
      },
      {
        method: 'GET',
        path: '/imx/null-items',
        description: 'Get list of items with null metadata or name',
        example: `${baseUrl}/imx/null-items`,
      },
    ],
  },
});
