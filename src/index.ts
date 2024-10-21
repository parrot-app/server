import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { ServerConfig } from './config';
import { logError, logIn, logOut, logSuccess } from './helpers/Logger';
import { CacheHandler } from './handlers/Cache.handler';
import { Config } from './interfaces/Config.interface';
import { CertGenerator } from './helpers/CertGenerator';
import https from 'https';
import http from 'http';
import fs from 'fs-extra';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

const cachePath = CacheHandler.init(ServerConfig);

const agent = new https.Agent({  
  rejectUnauthorized: ServerConfig.rejectUnauthorized,
});

app.use(async (req, res, next) => {
  const { method, url, headers, body } = req;
  const cachedRequest = getCachedRequest(req, res, ServerConfig);

  if (cachedRequest && !ServerConfig.bypassCache) {
    return useCachedResponse(cachedRequest, res);
  } else {
    await fetchExternalAPIAndCacheResponse(req, res, ServerConfig);
  }

  next();
});

function getCachedRequest(req: express.Request, res: express.Response, serverConfig: Config): any {
  const cacheHandler = new CacheHandler(req, res, serverConfig);
  return cacheHandler.cachedRequest;
}

function useCachedResponse(cachedRequest: any, res: express.Response): void {
  logIn(`Using cached response for ${cachedRequest.method} ${cachedRequest.url}`);

  const headerKeys = getCleanHeaderKeys(cachedRequest.headers);
  headerKeys.forEach((key) => {
    res.setHeader(key, cachedRequest.headers[key]);
  });

  if (cachedRequest.code) {
    res.statusCode = cachedRequest.code;
  }

  res.send(cachedRequest.response);
}

async function fetchExternalAPIAndCacheResponse(req: express.Request, res: express.Response, serverConfig: Config): Promise<void> {
  const externalUrl = `${serverConfig.baseUrl}${req.url}`;
  logOut(`Fetching external API: ${externalUrl}`);

  try {
    const response = await axios({
      method: req.method,
      url: externalUrl,
      headers: req.headers,
      data: req.body,
      proxy: false,
      httpsAgent: agent,
    });

    saveCacheRequest(req, res, serverConfig, response);
    sendResponse(res, response);

  } catch (error) {
    logError(`Error fetching external API: ${error}`);
    res.status(500).send('Error fetching external API');
  }
}

function saveCacheRequest(req: express.Request, res: express.Response, serverConfig: Config, response: any): void {
  const cacheHandler = new CacheHandler(req, res, serverConfig);
  cacheHandler.saveCacheRequest(response);
}

function sendResponse(res: express.Response, response: any): void {
  const headerKeys = getCleanHeaderKeys(response.headers);
  headerKeys.forEach((key) => {
    res.setHeader(key, response.headers[key]);
  });

  res.send(response.data);
}

function getCleanHeaderKeys(headers: any): Array<string> {
  const items = Object.keys(headers).filter(h => h === 'content-length' || 'transfer-encoding');
  if (items.length > 1) {
    return Object.keys(headers).filter(h => h !== 'transfer-encoding');
  }
  return [];
}

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
server?.listen(ServerConfig.port, () => {
  console.log(`🦜 [ParrotJS Server] running on ${ServerConfig.host}:${ServerConfig.port}`);
  logSuccess(`External queries will be sent to: ${ServerConfig.baseUrl}`);
});
