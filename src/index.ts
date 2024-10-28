import express from 'express';
import axios from 'axios';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs-extra';

import { ServerConfig } from './config';
import { logError, logIn, logOut, logSuccess } from './helpers/Logger';
import { CacheHandler } from './handlers/Cache.handler';
import { Config } from './interfaces/Config.interface';
import { CertGenerator } from './helpers/CertGenerator';
import { CachedRequest, CachedResponseHeader } from './interfaces/CachedRequest.interface';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

const parrotServer: {
  server: http.Server | https.Server | null,
  log: {
    errors: string[],
    warns: string[],
    info: string[],
  },
  host: string,
  target: string,
} = {
  server: null,
  log: {
    errors: [],
    warns: [],
    info: [],
  },
  host: '',
  target: ''
};

CacheHandler.init(ServerConfig);

const agent = new https.Agent({
  rejectUnauthorized: ServerConfig.rejectUnauthorized,
});

app.use(async (req, res, next) => {
  const cachedRequest = getCachedRequest(req, ServerConfig);

  if (cachedRequest && !ServerConfig.bypassCache) {
    return useCachedResponse(cachedRequest, res);
  } else {
    await fetchExternalAPIAndCacheResponse(req, res, ServerConfig);
  }

  next();
});

function getCachedRequest(req: express.Request, serverConfig: Config): CachedRequest | null {
  const cacheHandler = new CacheHandler(req, serverConfig);
  return cacheHandler.cachedRequest;
}

function useCachedResponse(cachedRequest: CachedRequest, res: express.Response): void {
  parrotServer.log.info.push(`Using cached response for ${cachedRequest.method} ${cachedRequest.url}`);

  if (Object.keys(cachedRequest?.responseHeaders).length > 0) {
    const headerKeys = getCleanHeaderKeys(cachedRequest.responseHeaders);
    Object.keys(cachedRequest?.responseHeaders).forEach(key => {
      if (
        headerKeys.find(k => key === k)
      ) {
        res.setHeader(key, cachedRequest.responseHeaders[key] || '');
      }
    });
  }

  if (cachedRequest.code) {
    res.statusCode = cachedRequest.code;
  }

  res.send(cachedRequest.responseBody);
}

async function fetchExternalAPIAndCacheResponse(req: express.Request, res: express.Response, serverConfig: Config): Promise<void> {
  const externalUrl = `${serverConfig.baseUrl}${req.url}`;
  parrotServer.log.info.push(`Fetching external API: ${externalUrl}`);

  try {
    const response = await axios({
      method: req.method,
      url: externalUrl,
      headers: req.headers,
      data: req.body,
      proxy: false,
      httpsAgent: agent,
    });

    saveCacheRequest(req, serverConfig, response);
    sendResponse(res, response);

  } catch (error) {
    parrotServer.log.errors.push(`Error fetching external API: ${error}`);
    res.status(500).send('Error fetching external API');
  }
}

function saveCacheRequest(req: express.Request, serverConfig: Config, response: any): void {
  const cacheHandler = new CacheHandler(req, serverConfig);
  cacheHandler.saveCacheRequest(response);
}

function sendResponse(res: express.Response, response: any): void {
  const headerKeys = getCleanHeaderKeys(response.headers);
  headerKeys.forEach((key) => {
    res.setHeader(key, response.headers[key]);
  });

  res.send(response.data);
}

/**
 * While in HTTPS, returning the header content-length AND transfer-encoding throws an error.
 * It appears that it's normal, see [this](https://github.com/sindresorhus/got/discussions/1576#discussioncomment-263225)
 */
function getCleanHeaderKeys(headers: CachedResponseHeader): Array<string> {
  const items = Object.keys(headers).filter(h => h === 'content-length' || 'transfer-encoding');
  if (items.length > 1) {
    return Object.keys(headers).filter(h => h !== 'transfer-encoding');
  }
  return [];
}

// Make sure to generate the certificates before trying to start our server
const serverKeysPaths = CertGenerator.generate(ServerConfig);

let server: http.Server | https.Server | null = null;
if (ServerConfig.isHttps && serverKeysPaths) {
  server = https.createServer({
    key: fs.readFileSync(serverKeysPaths.key),
    cert: fs.readFileSync(serverKeysPaths.cert),
  }, app);
} else {
  server = http.createServer(app);
}

export function startParrot() {
  server?.listen(ServerConfig.port, () => {
    parrotServer.server = server;
  });
  parrotServer.host = `${ServerConfig.host}:${ServerConfig.port}`;
  parrotServer.target = `${ServerConfig.baseUrl}`;
  return parrotServer;
}
