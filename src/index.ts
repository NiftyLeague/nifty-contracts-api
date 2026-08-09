import { config } from 'node-config-ts'
import './config.js' // side-effect: traced import of dist/src/config/default.json
import bodyParser from 'body-parser'
import cors from 'cors'
import express, { NextFunction, type Request, type Response } from 'express'

import { getBurnedDegens } from './utils/degensBurned'
import { resolveDegenMetadata, pipeRequest } from './utils/api'
import { handleNameChangeByInput } from './utils/handleNameChange'
import {
  resolveCirculatingSupply,
  resolveMaxSupply,
  resolveTotalSupply,
  resolveUnclaimedSupply,
} from './utils/nftl'

import { DEFAULTS, getEndpoints } from './constants/api'
import { CONTRACT_METHODS } from './constants/contracts'
import { LEGGIES } from './constants/metadata/degens'
import { S3_BASE_URL, S3_DEGENS_BUCKET, S3_MARKETPLACE_BUCKET } from './constants/aws'
import { MARKETPLACE_COLLECTION_METADATA } from './constants/metadata/marketplace'
import type { Attribute, TargetNetwork } from './types'

const app = express().set('port', config.port || 5005)

// Vercel terminates TLS at the edge and invokes this handler via @vercel/node's
// raw (req, res) bridge, where req.socket is undefined. Without trust proxy,
// Express 5's req.protocol getter reads req.socket.encrypted and throws on every
// request. Enabling trust proxy makes Express derive the protocol from
// X-Forwarded-Proto (which Vercel sets to https), and we build the base URL
// defensively below as a belt-and-suspenders measure.
app.set('trust proxy', true)

const buildBaseUrl = (req: Request): string => {
  const proto = req.get('x-forwarded-proto') || 'https'
  const host =
    req.get('host') || (config.host ? config.host[config.eth.network as TargetNetwork] : undefined)
  return `${proto}://${host}`
}

app.get('/', function (req: Request, res: Response) {
  const baseUrl = buildBaseUrl(req)
  res.json({
    ...DEFAULTS,
    endpoints: getEndpoints(baseUrl),
  })
})

app.use(bodyParser.json({ limit: '1mb' }))

app.use(cors())

//////////////////////////////////////////////
// ------ NFTL
//////////////////////////////////////////////

// All /NFTL/supply routes share the same shape: resolve, send, or hand the
// error to Express's error handler. Keeping one helper avoids duplicating the
// send/next branch across five route registrations.
const handleSupply = async (
  res: Response,
  next: NextFunction,
  resolve: () => Promise<string | null>
) => {
  const supply = await resolve()
  if (supply) res.send(supply)
  else next(new Error('Unable to resolve supply.'))
}

app.get('/NFTL/supply', async function (req: Request, res: Response, next: NextFunction) {
  await handleSupply(res, next, resolveCirculatingSupply)
})

app.get(
  '/NFTL/supply/circulating',
  async function (req: Request, res: Response, next: NextFunction) {
    await handleSupply(res, next, resolveCirculatingSupply)
  }
)

app.get('/NFTL/supply/unclaimed', async function (req: Request, res: Response, next: NextFunction) {
  await handleSupply(res, next, resolveUnclaimedSupply)
})

app.get('/NFTL/supply/total', async function (req: Request, res: Response, next: NextFunction) {
  await handleSupply(res, next, resolveTotalSupply)
})

app.get('/NFTL/supply/max', async function (req: Request, res: Response, next: NextFunction) {
  await handleSupply(res, next, resolveMaxSupply)
})

//////////////////////////////////////////////
// ------ DEGENs
//////////////////////////////////////////////

app.get('/degens/burn-list', async function (req: Request, res: Response, next: NextFunction) {
  const burnList = await getBurnedDegens()
  if (burnList) res.send(burnList)
  else next(new Error('Unable to resolve burn list.'))
})

app.get('/:network/degen/metadata/:token_id', async function (req: Request, res: Response) {
  const { network, token_id } = req.params
  pipeRequest(`${S3_BASE_URL}/${S3_DEGENS_BUCKET}/${network}/metadata/${token_id}.json`, res)
})

app.get('/:network/degen/image/:token_id', async function (req: Request, res: Response) {
  const { network, token_id } = req.params
  const type = LEGGIES.includes(Number(token_id)) ? 'gif' : 'png'
  pipeRequest(`${S3_BASE_URL}/${S3_DEGENS_BUCKET}/${network}/images/${token_id}.${type}`, res)
})

app.get('/:network/degen/:token_id/background', async function (req: Request, res: Response) {
  const metadata = await resolveDegenMetadata(req)
  const background = metadata?.attributes?.find((a: Attribute) => a.trait_type === 'Background')
  if (background) res.send(background.value)
  else res.status(404).send({ errors: [{ message: 'Background not found' }] })
})

//////////////////////////////////////////////
// ------ MARKETPLACE
//////////////////////////////////////////////

app.get('/imx/marketplace/collection.json', async function (req: Request, res: Response) {
  res.send(MARKETPLACE_COLLECTION_METADATA)
})

app.get('/imx/marketplace/metadata/:token_id', async function (req: Request, res: Response) {
  // Express 5 route params are strings; strip an optional .json suffix.
  const rawTokenId = String(req.params.token_id)
  const tokenId = rawTokenId.endsWith('.json') ? rawTokenId.slice(0, -5) : rawTokenId
  pipeRequest(`${S3_BASE_URL}/${S3_MARKETPLACE_BUCKET}/metadata/${tokenId}.json`, res)
})

app.get('/imx/marketplace/images/:token_id', async function (req: Request, res: Response) {
  const tokenId = String(req.params.token_id)
  // COMICS 1-100 are PNG, Items 101+ are GIF
  const fileType = Number(tokenId) <= 100 ? 'png' : 'gif'
  pipeRequest(`${S3_BASE_URL}/${S3_MARKETPLACE_BUCKET}/images/${tokenId}.${fileType}`, res)
})

//////////////////////////////////////////////
// ------ WEBHOOKS
//////////////////////////////////////////////

app.post(
  `/:network/webhooks/degen/${config.blocknative.webhookSecret}`,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const targetNetwork = req.params.network as TargetNetwork
      const tx = req.body
      if (
        targetNetwork === 'mainnet' &&
        tx.status === 'confirmed' &&
        tx.direction === 'incoming' &&
        tx.apiKey === config.blocknative.apiKey.degens
      ) {
        if (tx.input.startsWith(CONTRACT_METHODS.RENAME)) {
          console.log('DEGEN RENAME WEBHOOK TX:', tx)
          await handleNameChangeByInput(targetNetwork, tx.input)
        }
      }
      res.sendStatus(200)
    } catch (e) {
      next(e)
    }
  }
)

//////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err: Error, req: Request, res: Response, _: NextFunction) => {
  console.error(err)
  res.status(500).send({ errors: [{ message: err.message ?? 'Something went wrong' }] })
}

app.use(errorHandler)

if (!process.env.VERCEL) {
  app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'))
  })
}

export default app
