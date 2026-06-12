import * as jose from 'jose';

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (url.pathname == '/key' && request.method === 'POST') {
        const res = await generateKey(url.searchParams.get('alg') || 'RS256');
        return new Response(JSON.stringify(res), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (url.pathname == '/jwt' && request.method == 'POST') {
        if (request.headers.get('Content-Type') !== 'application/json') {
          return new Response(JSON.stringify({ error: 'Expected JSON' }), {
            status: 415,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const { privateKey, header, payload } = await request.json();
        const jwt = await signJwt({ header, payload, privateKeyPem: privateKey });
        return new Response(jwt);
      } else if (url.pathname == '/crl' && request.method === 'GET') {
        const crl = await getEmptyCRL();
        return new Response(crl, {
          headers: { 'Content-Type': 'application/pkix-crl' },
        });
      } else if (url.pathname == '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response('Not found', { status: 404 });
      }
    } catch (err) {
      console.error(err);
      return new Response(err.message, { status: 400 });
    }
  },
};

async function generateKey(alg) {
  const supportedAlgs = ['ES256', 'RS256', 'PS256'];
  if (!supportedAlgs.includes(alg)) {
    throw new Error(`Unsupported algorithm: ${alg}`);
  }
  const key = await jose.generateKeyPair(alg, { extractable: true });
  const publicPem = await jose.exportSPKI(key.publicKey);
  const privatePem = await jose.exportPKCS8(key.privateKey);
  const publicJwk = await jose.exportJWK(key.publicKey);
  return {
    publicPem,
    privatePem,
    publicJwk,
  };
}

async function signJwt({ header, payload, privateKeyPem }) {
  try {
    const privateKey = await jose.importPKCS8(privateKeyPem.replace(/\\n/g, '\n'), header.alg);
    const jwt = await new jose.SignJWT(payload).setProtectedHeader(header).sign(privateKey);
    return jwt;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to sign JWT');
  }
}

async function getEmptyCRL() {
  return `-----BEGIN X509 CRL-----
MIIBujCBowIBATANBgkqhkiG9w0BAQsFADA/MQswCQYDVQQGEwJERTEWMBQGA1UE
CgwNVGVzdCBQU0QyIFBLSTEYMBYGA1UEAwwPVGVzdCBJc3N1aW5nIENBFw0yNjA2
MTAwODIzMTRaFw0yNjA2MTcwODIzMTRaoDAwLjAfBgNVHSMEGDAWgBSDIMB67J8L
/vl5PhDpDUtd+ZDLJzALBgNVHRQEBAICEAAwDQYJKoZIhvcNAQELBQADggEBAG2s
B2G4iHcf2nOKHvdYTB/Nhb8xZFCOzH/q3YO4CXLKs+Q+jJ2ZbTe8GMCJC6V9AmE5
0Cn3bHYU7ycS6DipDWBB4SjfqJrJ5Znvi4q7JqKIn5H4lWabUHv0g9QKFJUknQm0
j0DQ4xjiLvDBnNlu7QV2PhdWBBA7humqlMvsXuthzg+nhvq5Emj0h9Z3d4OiXn7v
so0l+Iyo1fix6SSTY5tvHMQo/P9yhA7TfULIoNku9BzMOV2bbtiWwDEqCALwsq2c
gcExQesaSMhOkby0OpzZ9RHUT7vUDQz/MdTpEguBNxS+XC029Dbgo17/6lSmDrma
zfyF3aDtB4G04Uln3mw=
-----END X509 CRL-----`;
}
