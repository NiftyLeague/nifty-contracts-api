import bodyParser from 'body-parser';
import config from 'config';
import cors from 'cors';
import fetch from 'node-fetch';
import express, { Request, Response } from 'express';
import path from 'path';
import { AlchemyProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import groupBy from 'lodash/groupBy';

import { getItemIdByTokenId } from './imx-mint/libs/utils';
import env from './imx-mint/config/client';
import { CONTRACT_METHODS } from './constants';
import {
  getItemsRecursive,
  resolveDegenMetadata,
  pipeRequest,
} from './scripts/utils/api';
import { getTokenIdFromTxReceipt } from './scripts/utils/txReceipt';
import { handleNameChangeByInput } from './scripts/handleNameChange';
import { handleDepositConfirmation } from './scripts/deposit';
import { handleWithdrawConfirmation } from './scripts/withdraw';
import { resolveCirculatingSupply } from './scripts/nftl';
import { handleIMXMint } from './scripts/imx-mint';
import { TargetNetwork } from './types';
import { generateIMXAuthorisationHeaders } from './imx-mint/libs/sign';
require('dotenv').config();

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

//////////////////////////////////////////////
// ------ METADATA
//////////////////////////////////////////////

app.get(
  '/:network/degen/metadata/:token_id',
  async function (req: Request, res: Response) {
    const { network, token_id } = req.params;
    pipeRequest(
      `https://nifty-league.s3.amazonaws.com/degens/${network}/metadata/${token_id}.json`,
      res
    );
  }
);

app.get(
  '/:network/degen/image/:token_id',
  async function (req: Request, res: Response) {
    const { network, token_id } = req.params;
    const metadata = await resolveDegenMetadata(req);
    const background = metadata?.attributes?.find(
      (a: any) => a.trait_type === 'Background'
    )?.value;
    const tribe = metadata?.attributes?.find(
      (a: any) => a.trait_type === 'Tribe'
    )?.value;
    const type = background === 'Legendary' || tribe === '???' ? 'mp4' : 'png';
    pipeRequest(
      `https://nifty-league.s3.amazonaws.com/degens/${network}/images/${token_id}.${type}`,
      res
    );
  }
);

app.get(
  '/:network/degen/:token_id/background',
  async function (req: Request, res: Response) {
    const metadata = await resolveDegenMetadata(req);
    const background = metadata?.attributes?.find(
      (a: any) => a.trait_type === 'Background'
    );
    if (background) res.send(background.value);
    else res.sendStatus(404);
  }
);

app.get(
  '/imx/comics/metadata/:token_id',
  async function (req: Request, res: Response) {
    const tokenId = req.params.token_id;
    pipeRequest(
      `https://nifty-league.s3.amazonaws.com/imx/comics/metadata/${tokenId}.json`,
      res
    );
  }
);

app.get(
  '/imx/comics/image/:token_id',
  async function (req: Request, res: Response) {
    const tokenId = req.params.token_id;
    pipeRequest(
      `https://nifty-league.s3.amazonaws.com/imx/comics/images/${tokenId}.png`,
      res
    );
  }
);

app.get(
  '/imx/items/metadata/:token_id',
  async function (req: Request, res: Response) {
    const tokenId = req.params.token_id;
    const itemId = await getItemIdByTokenId(tokenId);
    pipeRequest(
      `https://nifty-league.s3.amazonaws.com/imx/items/metadata/${itemId}.json`,
      res
    );
  }
);

app.get(
  '/imx/items/image/:token_id',
  async function (req: Request, res: Response) {
    const tokenId = req.params.token_id;
    const itemId = await getItemIdByTokenId(tokenId);
    pipeRequest(
      `https://nifty-league.s3.amazonaws.com/imx/items/images/${itemId}.gif`,
      res
    );
  }
);

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
    const filtered = result.filter(
      (item: { metadata: any; name?: string }) => !item.metadata || !item.name
    );
    res.send({ total: filtered.length, result: filtered });
  } catch (e) {
    res.send(e);
  }
});

app.get('/imx/items/overview', async function (req: Request, res: Response) {
  try {
    const result = await getItemsRecursive();
    const itemBalances = Object.values(groupBy(result, 'metadata.item_id')).map(
      group => ({
        [group[0].metadata.name]: group.length,
      })
    );
    const holderBalances = Object.values(groupBy(result, 'user')).map(
      group => ({
        [group[0].user]: group.length,
      })
    );
    res.send({
      total: result.length,
      holders: holderBalances.length,
      balances: Object.values(itemBalances),
      holder_balances: Object.values(holderBalances),
    });
  } catch (e) {
    res.send(e);
  }
});

app.get(
  '/imx/metadata-refresh/:token_id',
  async function (req: Request, res: Response) {
    const tokenId = req.params.token_id;

    const privateKey = env.ownerAccountPrivateKey;
    const provider = new AlchemyProvider(env.ethNetwork, env.alchemyApiKey);
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(provider);
    const { timestamp, signature } = await generateIMXAuthorisationHeaders(
      signer
    );

    const headers = {
      'x-imx-eth-address': env.ownerAccountPublicKey,
      'x-imx-eth-signature': signature,
      'x-imx-eth-timestamp': timestamp,
    };
    const body = JSON.stringify({
      collection_address: env.collectionContractAddress,
      token_ids: [tokenId],
    });

    const response = await fetch(
      `${env.client.publicApiUrl}/metadata-refreshes`,
      {
        method: 'POST',
        headers,
        body,
      }
    );
    res.send(response);
  }
);

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
      console.log('DEGEN WEBHOOK TX:', tx);
      // if (tx.input.startsWith(CONTRACT_METHODS.PURCHASE)) {
      //   const tokenId = await getTokenIdFromTxReceipt(tx.hash);
      //   await safeGenerateNFT(targetNetwork, tokenId);
      // }
      if (tx.input.startsWith(CONTRACT_METHODS.RENAME)) {
        await getTokenIdFromTxReceipt(tx.hash);
        await handleNameChangeByInput(targetNetwork, tx.input);
      }
    }
    res.sendStatus(200);
  }
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
      if (tx.input.startsWith(CONTRACT_METHODS.DEPOSIT))
        await handleDepositConfirmation(tx);
      if (tx.input.startsWith(CONTRACT_METHODS.WITHDRAW))
        await handleWithdrawConfirmation(tx);
    }
    res.sendStatus(200);
  }
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
  }
);

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
