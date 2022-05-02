require('dotenv').config();
const config = require('getconfig');
const cors = require('cors');
const express = require('express');
var bodyParser = require('body-parser');
const path = require('path');
const { CONTRACT_METHODS } = require('./constants');

const PORT = process.env.PORT || 5000;

const app = express()
  .set('port', PORT)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.send('P2E API for the Nifty League!');
});

app.use(bodyParser.json());

app.use(cors());

app.post(
  `/:network/webhooks/p2e/${config.blocknative.webhookSecret}`,
  async function (req, res) {
    const targetNetwork = req.params.network;
    const tx = req.body;
    if (
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.blocknative.apiKey
    ) {
      console.log('WEBHOOK TX:', tx);
      if (tx.input.startsWith(CONTRACT_METHODS.DEPOSIT)) {
        console.log('deposit tx', targetNetwork);
      }
      if (tx.input.startsWith(CONTRACT_METHODS.WITHDRAW)) {
        console.log('withdraw tx', targetNetwork);
      }
    }
    res.sendStatus(200);
  }
);

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
