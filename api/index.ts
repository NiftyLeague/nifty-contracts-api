import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import config from 'config';
import cors from 'cors';
import fetch from 'node-fetch';
import express, { Request, Response } from 'express';
import path from 'path';
import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { groupBy, mapValues } from 'lodash';

dotenv.config();

import { getItemsRecursive, resolveDegenMetadata, pipeRequest } from './scripts/utils/api';
import { Attribute, Metadata, TargetNetwork } from './types';
import { CONTRACT_METHODS } from './constants';
import { S3_BASE_URL, DEGENS_S3_BUCKET, COMICS_S3_BUCKET, ITEMS_S3_BUCKET } from './constants/aws';

import { handleNameChangeByInput } from './scripts/handleNameChange';
import { handleDepositConfirmation } from './scripts/deposit';
import { handleWithdrawConfirmation } from './scripts/withdraw';
import { resolveCirculatingSupply, resolveMaxSupply, resolveTotalSupply, resolveUnclaimedSupply } from './scripts/nftl';
import { handleIMXMint } from './scripts/imx-mint';
import { generateIMXAuthorisationHeaders } from './scripts/imx/libs/sign';
import env from './scripts/imx/config/client';
import { getItemIdByTokenId } from './scripts/imx/libs/utils';
import { getBurnedDegens } from './scripts/degensBurned';
import { LEGGIES } from './constants/degenMetadata';

const app = express()
  .set('port', config.get('port'))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', function (req: Request, res: Response) {
  res.send('Smart Contract API for the Nifty League!');
});

app.use(bodyParser.json());

app.use(cors());

//////////////////////////////////////////////
// ------ NFTL
//////////////////////////////////////////////

app.get('/NFTL/supply', async function (req: Request, res: Response) {
  const supply = await resolveCirculatingSupply();
  if (supply) res.send(supply);
  else res.sendStatus(404);
});

app.get('/NFTL/supply/circulating', async function (req: Request, res: Response) {
  const supply = await resolveCirculatingSupply();
  if (supply) res.send(supply);
  else res.sendStatus(404);
});

app.get('/NFTL/supply/unclaimed', async function (req: Request, res: Response) {
  const supply = await resolveUnclaimedSupply();
  if (supply) res.send(supply);
  else res.sendStatus(404);
});

app.get('/NFTL/supply/total', async function (req: Request, res: Response) {
  const supply = await resolveTotalSupply();
  if (supply) res.send(supply);
  else res.sendStatus(404);
});

app.get('/NFTL/supply/max', async function (req: Request, res: Response) {
  const supply = await resolveMaxSupply();
  if (supply) res.send(supply);
  else res.sendStatus(404);
});

//////////////////////////////////////////////
// ------ DEGENs
//////////////////////////////////////////////

app.get('/degens/burn-list', async function (req: Request, res: Response) {
  const burnList = await getBurnedDegens();
  if (burnList) res.send(burnList);
  else res.sendStatus(404);
});

//////////////////////////////////////////////
// ------ METADATA
//////////////////////////////////////////////

app.get('/:network/degen/metadata/:token_id', async function (req: Request, res: Response) {
  const { network, token_id } = req.params;
  pipeRequest(`${S3_BASE_URL}/${DEGENS_S3_BUCKET}/${network}/metadata/${token_id}.json`, res);
});

app.get('/:network/degen/image/:token_id', async function (req: Request, res: Response) {
  const { network, token_id } = req.params;
  const type = LEGGIES.includes(Number(token_id)) ? 'gif' : 'png';
  pipeRequest(`${S3_BASE_URL}/${DEGENS_S3_BUCKET}/${network}/images/${token_id}.${type}`, res);
});

app.get('/:network/degen/:token_id/background', async function (req: Request, res: Response) {
  const metadata = await resolveDegenMetadata(req);
  const background = metadata?.attributes?.find((a: Attribute) => a.trait_type === 'Background');
  if (background) res.send(background.value);
  else res.sendStatus(404);
});

app.get('/imx/comics/metadata/:token_id', async function (req: Request, res: Response) {
  const tokenId = req.params.token_id;
  pipeRequest(`${S3_BASE_URL}/${COMICS_S3_BUCKET}/metadata/${tokenId}.json`, res);
});

app.get('/imx/comics/image/:token_id', async function (req: Request, res: Response) {
  const tokenId = req.params.token_id;
  pipeRequest(`${S3_BASE_URL}/${COMICS_S3_BUCKET}/images/${tokenId}.png`, res);
});

app.get('/imx/items/metadata/:token_id', async function (req: Request, res: Response) {
  const tokenId = req.params.token_id;
  const itemId = await getItemIdByTokenId(tokenId);
  pipeRequest(`${S3_BASE_URL}/${ITEMS_S3_BUCKET}/metadata/${itemId}.json`, res);
});

app.get('/imx/items/image/:token_id', async function (req: Request, res: Response) {
  const tokenId = req.params.token_id;
  const itemId = await getItemIdByTokenId(tokenId);
  pipeRequest(`${S3_BASE_URL}/${ITEMS_S3_BUCKET}/images/${itemId}.gif`, res);
});

app.get('/imx/items', async function (req: Request, res: Response) {
  const { cursor } = req.query;
  const assetsURL = `${env.client.publicApiUrl}/assets?collection=${
    env.collectionContractAddress
  }&order_by=updated_at&page_size=200${cursor ? `&cursor=${cursor}` : ''}`;
  pipeRequest(assetsURL, res);
});

app.get('/imx/null-items', async function (req: Request, res: Response) {
  try {
    const result = await getItemsRecursive();
    const filtered = result.filter((item: { metadata: Metadata; name?: string }) => !item.metadata || !item.name);
    res.send({ total: filtered.length, result: filtered });
  } catch (e) {
    res.send(e);
  }
});

app.get('/imx/items/overview', async function (req: Request, res: Response) {
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
    res.send(e);
  }
});

app.get('/imx/metadata-refresh/:token_id', async function (req: Request, res: Response) {
  const tokenId = req.params.token_id;

  const privateKey = env.ownerAccountPrivateKey;
  const provider = new AlchemyProvider(env.ethNetwork, env.alchemyApiKey);
  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);
  const { timestamp, signature } = await generateIMXAuthorisationHeaders(signer);

  const headers = {
    'x-imx-eth-address': env.ownerAccountPublicKey,
    'x-imx-eth-signature': signature,
    'x-imx-eth-timestamp': timestamp,
  };
  const body = JSON.stringify({
    collection_address: env.collectionContractAddress,
    token_ids: [tokenId],
  });

  const response = await fetch(`${env.client.publicApiUrl}/metadata-refreshes`, {
    method: 'POST',
    headers,
    body,
  });
  res.send(response);
});

app.get('/imx/metadata-refresh-all/:max_token_id', async function (req: Request, res: Response) {
  const maxTokenId = req.params.max_token_id;
  const tokenIds = Array.from({ length: Number(maxTokenId) }, (_, index) => (index + 1).toString());

  const privateKey = env.ownerAccountPrivateKey;
  const provider = new AlchemyProvider(env.ethNetwork, env.alchemyApiKey);
  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);
  const { timestamp, signature } = await generateIMXAuthorisationHeaders(signer);

  const headers = {
    'x-imx-eth-address': env.ownerAccountPublicKey,
    'x-imx-eth-signature': signature,
    'x-imx-eth-timestamp': timestamp,
  };
  const body = JSON.stringify({
    collection_address: env.collectionContractAddress,
    token_ids: tokenIds,
  });

  const response = await fetch(`${env.client.publicApiUrl}/metadata-refreshes`, {
    method: 'POST',
    headers,
    body,
  });
  res.send(response);
});

//////////////////////////////////////////////
// ------ WEBHOOKS
//////////////////////////////////////////////

app.post(
  `/:network/webhooks/degen/${config.get('blocknative.webhookSecret')}`,
  async function (req: Request, res: Response) {
    const targetNetwork = req.params.network as TargetNetwork;
    const tx = req.body;
    if (
      targetNetwork === 'mainnet' &&
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.get('blocknative.apiKey.degens')
    ) {
      if (tx.input.startsWith(CONTRACT_METHODS.RENAME)) {
        console.log('DEGEN RENAME WEBHOOK TX:', tx);
        await handleNameChangeByInput(targetNetwork, tx.input);
      }
    }
    res.sendStatus(200);
  },
);

app.post(
  `/:network/webhooks/p2e/${config.get('blocknative.webhookSecret')}`,
  async function (req: Request, res: Response) {
    const targetNetwork = req.params.network as TargetNetwork;
    const tx = req.body;
    if (
      targetNetwork === 'mainnet' &&
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.get('blocknative.apiKey.p2e')
    ) {
      console.log('P2E WEBHOOK TX:', tx);
      if (tx.input.startsWith(CONTRACT_METHODS.DEPOSIT)) await handleDepositConfirmation(tx);
      if (tx.input.startsWith(CONTRACT_METHODS.WITHDRAW)) await handleWithdrawConfirmation(tx);
    }
    res.sendStatus(200);
  },
);

app.post(
  `/:network/webhooks/comics/${config.get('blocknative.webhookSecret')}`,
  async function (req: Request, res: Response) {
    const targetNetwork = req.params.network as TargetNetwork;
    const tx = req.body;
    if (
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.get('blocknative.apiKey.comics')
    ) {
      console.log('COMICS WEBHOOK TX:', targetNetwork, tx);
      handleIMXMint(tx, targetNetwork);
    }
    res.sendStatus(200);
  },
);

//////////////////////////////////////////////

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
