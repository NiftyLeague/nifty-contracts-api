import { config } from 'node-config-ts';
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { NextFunction, type Request, type Response } from 'express';
import fetch from 'node-fetch';
import { groupBy, mapValues } from 'lodash-es';
import path from 'path';

import { generateIMXAuthorisationHeaders } from './utils/sign';
import { getItemIdByTokenId_SAFE } from './utils/getItemIdByTokenId';

import { getBurnedDegens } from './utils/degensBurned';
import { resolveDegenMetadata, pipeRequest } from './utils/api';
import { getItemsRecursive } from './utils/getItemsRecursive';
import { handleNameChangeByInput } from './utils/handleNameChange';
import { resolveCirculatingSupply, resolveMaxSupply, resolveTotalSupply, resolveUnclaimedSupply } from './utils/nftl';
import { getComicsHolderSnapshot, getItemsHolderSnapshot, getCombinedSnapshot } from './utils/snapshots';
import { getWallet } from './utils/wallet';

import { CONTRACT_METHODS } from './constants/contracts';
import { LEGGIES } from './constants/metadata/degens';
import {
  S3_BASE_URL,
  S3_COMICS_BUCKET,
  S3_DEGENS_BUCKET,
  S3_ITEMS_BUCKET,
  S3_MARKETPLACE_BUCKET,
} from './constants/aws';
import { MARKETPLACE_COLLECTION_METADATA } from './constants/metadata/marketplace';
import type { Attribute, Metadata, TargetNetwork } from './types';

const network = config.eth.network as TargetNetwork;

const __dirname = path.resolve();

const app = express()
  .set('port', config.port || 5005)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', function (req: Request, res: Response) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    name: 'Nifty League Contracts API',
    description: 'Smart Contract API for Nifty League',
    version: '1.0.0',
    endpoints: {
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
          {
            method: 'GET',
            path: '/imx/items/overview',
            description: 'Get full overview of items statistics',
            example: `${baseUrl}/imx/items/overview`,
          },
        ],
      },
    },
  });
});

app.use(bodyParser.json());

app.use(cors());

//////////////////////////////////////////////
// ------ NFTL
//////////////////////////////////////////////

app.get('/NFTL/supply', async function (req: Request, res: Response, next: NextFunction) {
  const supply = await resolveCirculatingSupply();
  if (supply) res.send(supply);
  else next(new Error('Unable to resolve supply.'));
});

app.get('/NFTL/supply/circulating', async function (req: Request, res: Response, next: NextFunction) {
  const supply = await resolveCirculatingSupply();
  if (supply) res.send(supply);
  else next(new Error('Unable to resolve supply.'));
});

app.get('/NFTL/supply/unclaimed', async function (req: Request, res: Response, next: NextFunction) {
  const supply = await resolveUnclaimedSupply();
  if (supply) res.send(supply);
  else next(new Error('Unable to resolve supply.'));
});

app.get('/NFTL/supply/total', async function (req: Request, res: Response, next: NextFunction) {
  const supply = await resolveTotalSupply();
  if (supply) res.send(supply);
  else next(new Error('Unable to resolve supply.'));
});

app.get('/NFTL/supply/max', async function (req: Request, res: Response, next: NextFunction) {
  const supply = await resolveMaxSupply();
  if (supply) res.send(supply);
  else next(new Error('Unable to resolve supply.'));
});

//////////////////////////////////////////////
// ------ DEGENs
//////////////////////////////////////////////

app.get('/degens/burn-list', async function (req: Request, res: Response, next: NextFunction) {
  const burnList = await getBurnedDegens();
  if (burnList) res.send(burnList);
  else next(new Error('Unable to resolve burn list.'));
});

app.get('/:network/degen/metadata/:token_id', async function (req: Request, res: Response) {
  const { network, token_id } = req.params;
  pipeRequest(`${S3_BASE_URL}/${S3_DEGENS_BUCKET}/${network}/metadata/${token_id}.json`, res);
});

app.get('/:network/degen/image/:token_id', async function (req: Request, res: Response) {
  const { network, token_id } = req.params;
  const type = LEGGIES.includes(Number(token_id)) ? 'gif' : 'png';
  pipeRequest(`${S3_BASE_URL}/${S3_DEGENS_BUCKET}/${network}/images/${token_id}.${type}`, res);
});

app.get('/:network/degen/:token_id/background', async function (req: Request, res: Response) {
  const metadata = await resolveDegenMetadata(req);
  const background = metadata?.attributes?.find((a: Attribute) => a.trait_type === 'Background');
  if (background) res.send(background.value);
  else res.status(404).send({ errors: [{ message: 'Background not found' }] });
});

//////////////////////////////////////////////
// ------ MARKETPLACE
//////////////////////////////////////////////

app.get('/imx/marketplace/collection.json', async function (req: Request, res: Response) {
  res.send(MARKETPLACE_COLLECTION_METADATA);
});

app.get('/imx/marketplace/metadata/:token_id', async function (req: Request, res: Response) {
  let tokenId = req.params.token_id;
  if (tokenId.endsWith('.json')) tokenId = tokenId.slice(0, -5);
  pipeRequest(`${S3_BASE_URL}/${S3_MARKETPLACE_BUCKET}/metadata/${tokenId}.json`, res);
});

app.get('/imx/marketplace/images/:token_id', async function (req: Request, res: Response) {
  const tokenId = req.params.token_id;
  // COMICS 1-100 are PNG, Items 101+ are GIF
  const fileType = Number(tokenId) <= 100 ? 'png' : 'gif';
  pipeRequest(`${S3_BASE_URL}/${S3_MARKETPLACE_BUCKET}/images/${tokenId}.${fileType}`, res);
});

//////////////////////////////////////////////
// ------ MIGRATION SNAPSHOT (DEPRECATED)
//////////////////////////////////////////////

app.get('/imx/snapshot/comics', async function (req: Request, res: Response, next: NextFunction) {
  const snapshot = await getComicsHolderSnapshot();
  if (snapshot) res.send(snapshot);
  else next(new Error('Unable to resolve comics snapshot.'));
});

app.get('/imx/snapshot/items', async function (req: Request, res: Response, next: NextFunction) {
  const snapshot = await getItemsHolderSnapshot();
  if (snapshot) res.send(snapshot);
  else next(new Error('Unable to resolve items snapshot.'));
});

app.get('/imx/snapshot/combined', async function (req: Request, res: Response, next: NextFunction) {
  const snapshot = await getCombinedSnapshot();
  if (snapshot) res.send(snapshot);
  else next(new Error('Unable to resolve snapshot.'));
});

//////////////////////////////////////////////
// ------ COMICS (DEPRECATED)
//////////////////////////////////////////////

app.get('/imx/comics/metadata/:token_id', async function (req: Request, res: Response) {
  const tokenId = req.params.token_id;
  pipeRequest(`${S3_BASE_URL}/${S3_COMICS_BUCKET}/metadata/${tokenId}.json`, res);
});

app.get('/imx/comics/image/:token_id', async function (req: Request, res: Response) {
  const tokenId = req.params.token_id;
  pipeRequest(`${S3_BASE_URL}/${S3_COMICS_BUCKET}/images/${tokenId}.png`, res);
});

//////////////////////////////////////////////
// ------ ITEMS (DEPRECATED)
//////////////////////////////////////////////

app.get('/imx/items/metadata/:token_id', async function (req: Request, res: Response, next: NextFunction) {
  try {
    const tokenId = req.params.token_id;
    const itemId = await getItemIdByTokenId_SAFE(tokenId);
    pipeRequest(`${S3_BASE_URL}/${S3_ITEMS_BUCKET}/metadata/${itemId}.json`, res);
  } catch (e) {
    next(e);
  }
});

app.get('/imx/items/image/:token_id', async function (req: Request, res: Response, next: NextFunction) {
  try {
    const tokenId = req.params.token_id;
    const itemId = await getItemIdByTokenId_SAFE(tokenId);
    pipeRequest(`${S3_BASE_URL}/${S3_ITEMS_BUCKET}/images/${itemId}.gif`, res);
  } catch (e) {
    next(e);
  }
});

app.get('/imx/items', async function (req: Request, res: Response) {
  const { cursor } = req.query;
  const { collection, client } = config.imx[network];
  const assetsURL = `${client.publicApiUrl}/assets?collection=${
    collection.contractAddress
  }&order_by=updated_at&page_size=200${cursor ? `&cursor=${cursor}` : ''}`;
  pipeRequest(assetsURL, res);
});

app.get('/imx/null-items', async function (req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getItemsRecursive();
    const filtered = result.filter((item: { metadata: Metadata; name?: string }) => !item.metadata || !item.name);
    res.send({ total: filtered.length, result: filtered });
  } catch (e) {
    next(e);
  }
});

app.get('/imx/items/overview', async function (req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getItemsRecursive();
    const itemBalances = Object.values(groupBy(result, 'metadata.item_id')).map(group => ({
      [group[0].metadata.name]: group.length,
    }));
    const holders = groupBy(result, 'user');
    const holderBalances = mapValues(holders, v => v.length);
    const holderKeyBalances = mapValues(holders, v => v.filter(item => item.metadata.item_id === 7).length);
    const removeNullBal = Object.fromEntries(Object.entries(holderKeyBalances).filter(([, v]) => v !== 0));
    res.send({
      total_items: result.length,
      total_holders: Object.keys(holderBalances).length,
      key_holders: Object.keys(removeNullBal).length,
      item_balances: Object.assign({}, ...itemBalances),
      holder_balances: holderBalances,
      holder_key_balances: removeNullBal,
    });
  } catch (e) {
    next(e);
  }
});

app.get('/imx/metadata-refresh/:token_id', async function (req: Request, res: Response, next: NextFunction) {
  try {
    const tokenId = req.params.token_id;
    const signer = getWallet();
    const { collection, client } = config.imx[network];
    const { timestamp, signature } = await generateIMXAuthorisationHeaders(signer);

    const headers = {
      'x-imx-eth-address': signer.address,
      'x-imx-eth-signature': signature,
      'x-imx-eth-timestamp': timestamp,
    };
    const body = JSON.stringify({
      collection_address: collection.contractAddress,
      token_ids: [tokenId],
    });

    const response = await fetch(`${client.publicApiUrl}/metadata-refreshes`, {
      method: 'POST',
      headers,
      body,
    });
    res.send(response);
  } catch (e) {
    next(e);
  }
});

app.get('/imx/metadata-refresh-all/:max_token_id', async function (req: Request, res: Response, next: NextFunction) {
  try {
    const maxTokenId = req.params.max_token_id;
    const tokenIds = Array.from({ length: Number(maxTokenId) }, (_, index) => (index + 1).toString());

    const signer = getWallet();
    const { collection, client } = config.imx[network];
    const { timestamp, signature } = await generateIMXAuthorisationHeaders(signer);

    const headers = {
      'x-imx-eth-address': signer.address,
      'x-imx-eth-signature': signature,
      'x-imx-eth-timestamp': timestamp,
    };
    const body = JSON.stringify({
      collection_address: collection.contractAddress,
      token_ids: tokenIds,
    });

    const response = await fetch(`${client.publicApiUrl}/metadata-refreshes`, {
      method: 'POST',
      headers,
      body,
    });
    res.send(response);
  } catch (e) {
    next(e);
  }
});

//////////////////////////////////////////////
// ------ WEBHOOKS
//////////////////////////////////////////////

app.post(
  `/:network/webhooks/degen/${config.blocknative.webhookSecret}`,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const targetNetwork = req.params.network as TargetNetwork;
      const tx = req.body;
      if (
        targetNetwork === 'mainnet' &&
        tx.status === 'confirmed' &&
        tx.direction === 'incoming' &&
        tx.apiKey === config.blocknative.apiKey.degens
      ) {
        if (tx.input.startsWith(CONTRACT_METHODS.RENAME)) {
          console.log('DEGEN RENAME WEBHOOK TX:', tx);
          await handleNameChangeByInput(targetNetwork, tx.input);
        }
      }
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  },
);

// app.post(
//   `/:network/webhooks/p2e/${config.blocknative.webhookSecret}`,
//   async function (req: Request, res: Response, next: NextFunction) {
//     try {
//       const targetNetwork = req.params.network as TargetNetwork;
//       const tx = req.body;
//       if (
//         targetNetwork === 'mainnet' &&
//         tx.status === 'confirmed' &&
//         tx.direction === 'incoming' &&
//         tx.apiKey === config.blocknative.apiKey.p2e
//       ) {
//         console.log('P2E WEBHOOK TX:', tx);
//         if (tx.input.startsWith(CONTRACT_METHODS.DEPOSIT)) await handleDepositConfirmation(tx);
//         if (tx.input.startsWith(CONTRACT_METHODS.WITHDRAW)) await handleWithdrawConfirmation(tx);
//       }
//       res.sendStatus(200);
//     } catch (e) {
//       next(e);
//     }
//   },
// );

// app.post(
//   `/:network/webhooks/comics/${config.blocknative.webhookSecret}`,
//   async function (req: Request, res: Response, next: NextFunction) {
//     try {
//       const targetNetwork = req.params.network as TargetNetwork;
//       const tx = req.body;
//       if (tx.status === 'confirmed' && tx.direction === 'incoming' && tx.apiKey === config.blocknative.apiKey.comics) {
//         console.log('COMICS WEBHOOK TX:', targetNetwork, tx);
//         handleIMXMint(tx, targetNetwork);
//       }
//       res.sendStatus(200);
//     } catch (e) {
//       next(e);
//     }
//   },
// );

//////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err: Error, req: Request, res: Response, _: NextFunction) => {
  console.error(err);
  res.status(500).send({ errors: [{ message: err.message ?? 'Something went wrong' }] });
};

app.use(errorHandler);

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

export default app;
