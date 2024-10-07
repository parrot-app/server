import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { ServerConfig } from './config';
import { logError, logIn, logOut, logSuccess } from './helpers/Logger';
import { CacheHandler } from './handlers/Cache.handler';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

const cachePath = CacheHandler.init(ServerConfig);

app.use(async (req, res, next) => {
  const { method, url, headers, body } = req;

  const cacheHandler = new CacheHandler(req, res, ServerConfig);
  const cachedRequest = cacheHandler.cachedRequest;

  if (cachedRequest && !ServerConfig.bypassCache) {
    // Return cached response
    logIn(`Using cached response for ${method} ${url}`);
    const cachedResponseHeaders = cachedRequest?.headers;
    if (
      cachedResponseHeaders
      && typeof cachedResponseHeaders === 'object'
      && Object.keys(cachedResponseHeaders).length > 0
    ) {
      Object.keys(cachedResponseHeaders).forEach((key) => {
        res.setHeader(key, cachedResponseHeaders[key as keyof typeof cachedResponseHeaders] as string);
      });
    }
    if (cachedRequest.code) {
      res.statusCode = cachedRequest.code;
    }
    res.send(cachedRequest.response);
  } else {
    // Call external API and cache response
    console.log(ServerConfig.baseUrl)
    const externalUrl = `${ServerConfig.baseUrl}${url}`;
    logOut(`Fetching external API: ${externalUrl}`);
    try {
      const response = await axios({
        method,
        url: externalUrl,
        headers: headers,
        data: body,
        proxy: false,
      });
      const responseBody = response.data;
      const responseHeaders = response.headers;
      
      cacheHandler.saveCacheRequest(response);

      Object.keys(responseHeaders).forEach((key) => {
        res.setHeader(key, responseHeaders[key as keyof typeof responseHeaders] as string);
      });

      res.send(responseBody);
    } catch (error) {
      logError(`Error fetching external API: ${error}`);
      res.status(500).send('Error fetching external API');
    }
  }
});

app.listen(ServerConfig.port, ServerConfig.host, () => {
  console.log(`🦜 [ParrotJS Server] running on http://${ServerConfig.host}:${ServerConfig.port}`);
  logSuccess(`External queries will be sent to: ${ServerConfig.baseUrl}`);
});
