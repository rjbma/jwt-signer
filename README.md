# jwt-signer

> ⚠️ **FOR TESTING PURPOSES ONLY** ⚠️
>
> This service is intended **strictly for testing and development use**. It returns private keys over HTTP and signs arbitrary JWTs with caller-supplied keys. Do **not** deploy or use this in production, and do **not** use it to handle real credentials, secrets, or sensitive data.

A small Cloudflare Workers service for generating signing keys and signing JWTs using the `jose` library.

## Features

- Generate RSA or EC key pairs for signing JWTs
- Sign JWTs using a provided private key
- Health check endpoint

## Endpoints

### `POST /key`
Generates a new key pair.

- Query parameter: `alg` (optional)
  - Supported values: `ES256`, `RS256`, `PS256`
  - Defaults to `RS256`

Response body:

```json
{
  "publicPem": "...",
  "privatePem": "...",
  "dpopKeyJwk": { ... }
}
```

### `POST /jwt`
Signs a JWT with a provided private key.

Request body must be JSON with the following shape:

```json
{
  "privateKey": "<private key PEM>",
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
  }
}
```

Response body: signed JWT string.

### `GET /health`
Returns a simple health response:

```json
{
  "status": "ok"
}
```

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:8787` and send requests to the worker.

## Deployment

Deploy to Cloudflare Workers using `wrangler`.

### 1. Authenticate with Cloudflare

Either log in interactively:

```bash
npx wrangler login
```

Or set an API token (useful for CI):

```bash
export CLOUDFLARE_API_TOKEN=<your-token>
export CLOUDFLARE_ACCOUNT_ID=<your-account-id>
```

Create a token at https://dash.cloudflare.com/profile/api-tokens using the **Edit Cloudflare Workers** template.

### 2. Deploy

```bash
npm run deploy
```

The worker will be published to `https://jwt-signer.<your-subdomain>.workers.dev`.

## Notes

- This project uses Cloudflare Workers with `wrangler`.
- JWT signing is handled by the `jose` library.
