require('dotenv').config();
const config = require('getconfig');
const cors = require('cors');
const express = require('express');
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const { CONTRACT_METHODS } = require('./constants');
const { sleep } = require('./scripts/helpers');
const { handleDepositConfirmation } = require('./scripts/deposit');
const { handleWithdrawConfirmation } = require('./scripts/withdraw');

const PORT = process.env.PORT || 5000;

const app = express()
  .set('port', PORT)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.send('Smart Contract API for the Nifty League!');
});

app.use(bodyParser.json());

app.use(cors());

//////////////////////////////////////////////
// ------ NFTL
//////////////////////////////////////////////

async function resolveCirculatingSupply(req) {
  try {
    const secret = process.env.ETHERSCAN_API_KEY;
    const contractaddress = '0x3c8d2fce49906e11e71cb16fa0ffeb2b16c29638';
    const supplyURI = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractaddress}&apikey=${secret}`;
    const supplyRes = await fetch(supplyURI);
    await sleep(5000);
    const timelockaddress = '0xfeb2f45a3817ef9156a6c771ffc90098d3dfe003';
    const timelockURI = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contractaddress}&address=${timelockaddress}&tag=latest&apikey=${secret}`;
    const lockedRes = await fetch(timelockURI);
    if (supplyRes.status < 400 && lockedRes.status < 400) {
      const { result: supply } = await supplyRes.json();
      const { result: locked } = await lockedRes.json();
      return BigInt(supply) - BigInt(locked);
    }
    return null;
  } catch (e) {
    return null;
  }
}

app.get('/NFTL/supply', async function (req, res) {
  const supply = await resolveCirculatingSupply(req);
  console.log('supply', supply, supply.toString());
  if (supply) res.send(supply.toString());
  else res.sendStatus(404);
});

//////////////////////////////////////////////
// ------ METADATA
//////////////////////////////////////////////

async function fetchMetadata(URI) {
  try {
    const response = await fetch(URI);
    if (response.status < 400) return response.json();
    return null;
  } catch (e) {
    return null;
  }
}

async function resolveDegenMetadata(req) {
  const targetNetwork = req.params.network;
  const tokenId = parseInt(req.params.token_id).toString();
  const URI = `https://nifty-league.s3.amazonaws.com/degens/${targetNetwork}/metadata/${tokenId}.json`;
  return fetchMetadata(URI);
}

app.get('/:network/degen/:token_id', async function (req, res) {
  const metadata = await resolveDegenMetadata(req);
  if (metadata) res.send(metadata);
  else res.sendStatus(404);
});

app.get('/:network/degen/:token_id/background', async function (req, res) {
  const metadata = await resolveDegenMetadata(req);
  const background = metadata?.attributes?.find(
    a => a.trait_type === 'Background'
  );
  if (background) res.send(background.value);
  else res.sendStatus(404);
});

async function resolveComicMetadata(req) {
  const tokenId = parseInt(req.params.token_id, 16).toString();
  const URI = `https://nifty-league.s3.amazonaws.com/launch-comics/metadata/${tokenId}.json`;
  return fetchMetadata(URI);
}

app.get('/:network/comics/:token_id', async function (req, res) {
  const metadata = await resolveComicMetadata(req);
  if (metadata) res.send(metadata);
  else res.sendStatus(404);
});

async function resolveItemMetadata(req) {
  const itemId = parseInt(req.params.item_id, 16).toString();
  const URI = `https://nifty-league.s3.amazonaws.com/imx/items/metadata/${itemId}.json`;
  return fetchMetadata(URI);
}

app.get('/imx/items/:item_id', async function (req, res) {
  const metadata = await resolveItemMetadata(req);
  if (metadata) res.send(metadata);
  else res.sendStatus(404);
});

//////////////////////////////////////////////
// ------ WEBHOOKS
//////////////////////////////////////////////

app.post(
  `/:network/webhooks/degen/${config.blocknative.webhookSecret}`,
  async function (req, res) {
    const targetNetwork = req.params.network;
    const tx = req.body;
    if (
      targetNetwork === 'mainnet' &&
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.blocknative.apiKey.degens
    ) {
      console.log('DEGEN WEBHOOK TX:', tx);
      // if (tx.input.startsWith(CONTRACT_METHODS.PURCHASE)) {
      //   const tokenId = await getTokenIdFromTxReceipt(tx.hash);
      //   await safeGenerateNFT(targetNetwork, tokenId);
      // }
      // if (tx.input.startsWith(CONTRACT_METHODS.RENAME)) {
      //   await getTokenIdFromTxReceipt(tx.hash);
      //   await handleNameChangeByInput(targetNetwork, tx.input);
      // }
    }
    res.sendStatus(200);
  }
);

app.post(
  `/:network/webhooks/p2e/${config.blocknative.webhookSecret}`,
  async function (req, res) {
    const targetNetwork = req.params.network;
    const tx = req.body;
    if (
      targetNetwork === 'mainnet' &&
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.blocknative.apiKey.p2e
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
  `/:network/webhooks/comics/${config.blocknative.webhookSecret}`,
  async function (req, res) {
    const targetNetwork = req.params.network;
    const tx = req.body;
    if (
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.blocknative.apiKey.comics
    ) {
      console.log('COMICS WEBHOOK TX:', tx);
      // TODO: Mint item logic
    }
    res.sendStatus(200);
  }
);

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
