// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
require('dotenv').config();
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const bodyParser = require('body-parser');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'config'.
const config = require('getconfig');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const cors = require('cors');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const express = require('express');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const path = require('path');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'CONTRACT_M... Remove this comment to see the full error message
const { CONTRACT_METHODS } = require('./constants');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'resolveDeg... Remove this comment to see the full error message
const { resolveDegenMetadata, pipeRequest } = require('./scripts/helpers');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'handleDepo... Remove this comment to see the full error message
const { handleDepositConfirmation } = require('./scripts/deposit');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'handleWith... Remove this comment to see the full error message
const { handleWithdrawConfirmation } = require('./scripts/withdraw');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'resolveCir... Remove this comment to see the full error message
const { resolveCirculatingSupply } = require('./scripts/nftl');

// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const PORT = process.env.PORT || 5000;

const app = express()
  .set('port', PORT)
  // @ts-expect-error TS(2304): Cannot find name '__dirname'.
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', function (req: any, res: any) {
  res.send('Smart Contract API for the Nifty League!');
});

app.use(bodyParser.json());

app.use(cors());

//////////////////////////////////////////////
// ------ NFTL
//////////////////////////////////////////////

app.get('/NFTL/supply', async function (req: any, res: any) {
  const supply = await resolveCirculatingSupply();
  if (supply) res.send(supply);
  else res.sendStatus(404);
});

//////////////////////////////////////////////
// ------ METADATA
//////////////////////////////////////////////

app.get('/:network/degen/metadata/:token_id', async function (req: any, res: any) {
  const { network, token_id } = req.params;
  pipeRequest(
    `https://nifty-league.s3.amazonaws.com/degens/${network}/metadata/${token_id}.json`,
    res
  );
});

app.get('/:network/degen/image/:token_id', async function (req: any, res: any) {
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
});

app.get('/:network/degen/:token_id/background', async function (req: any, res: any) {
  const metadata = await resolveDegenMetadata(req);
  const background = metadata?.attributes?.find(
    (a: any) => a.trait_type === 'Background'
  );
  if (background) res.send(background.value);
  else res.sendStatus(404);
});

app.get('/imx/comics/metadata/:token_id', async function (req: any, res: any) {
  const tokenId = req.params.token_id;
  pipeRequest(
    `https://nifty-league.s3.amazonaws.com/imx/comics/metadata/${tokenId}.json`,
    res
  );
});

app.get('/imx/comics/image/:token_id', async function (req: any, res: any) {
  const tokenId = req.params.token_id;
  pipeRequest(
    `https://nifty-league.s3.amazonaws.com/imx/comics/images/${tokenId}.png`,
    res
  );
});

app.get('/imx/items/metadata/:item_id', async function (req: any, res: any) {
  const itemId = req.params.item_id;
  pipeRequest(
    `https://nifty-league.s3.amazonaws.com/imx/items/metadata/${itemId}.json`,
    res
  );
});

app.get('/imx/items/image/:item_id', async function (req: any, res: any) {
  const itemId = req.params.item_id;
  pipeRequest(
    `https://nifty-league.s3.amazonaws.com/imx/items/images/${itemId}.mp4`,
    res
  );
});

//////////////////////////////////////////////
// ------ WEBHOOKS
//////////////////////////////////////////////

app.post(
  `/:network/webhooks/degen/${config.blocknative.webhookSecret}`,
  async function (req: any, res: any) {
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
  async function (req: any, res: any) {
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
  async function (req: any, res: any) {
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
