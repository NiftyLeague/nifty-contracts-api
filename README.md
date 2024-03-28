# Simple API for catching webhooks

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Getting Started

### Requirements

You need node.js (lts/gallium) and npm installed. If you want to do a Heroku deployment, download and install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and run `heroku login` locally.

## API Setup

1. Click the **Deploy to Heroku** button above to instantly get it up and running somewhere. You can pick the URL! For this example, let's say that it's `your-metadata-api.herokuapp.com`.
2. Run `heroku git:clone -a your-metadata-api`, and `cd` into your new directory.
3. Run `npm install`.
4. Add a `.env` file using `.sample.env` as a reference.
5. Save the Heroku URL you picked into `config/default.js` as the `host` variable (e.g. `https://your-metadata-api.herokuapp.com`). This is the root URL for the tokens on your contract.
6. Deploy to Heroku by committing your changes and using `git push heroku master`.

## API Quick Start

Run `yarn dev` to start up your local API on post 5005 in watchmode

## Commander Quick Start

To run commands locally:

1. Run `yarn` to install packages
2. Run `yarn build` to compile to dist/
3. Run `npm link` to add the `minty` command to your `$PATH`. This makes it easier to run Minty from anywhere on your computer.
4. Run a command such as `minty refresh-degen 1`

## IPFS Quick Start

> This command continues to run. All further commands must be entered in another terminal window.

> if there's no local ipfs repo at `$HOME/.ipfs`, initialize one:

```bash
npx go-ipfs init
```

> run local ipfs daemon

```bash
npx go-ipfs daemon
```

---
