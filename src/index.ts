import express from 'express';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import colors from 'colors';
import { ServerConfig } from './config';
import { logError, logIn, logOut } from './helpers/Logger';
import { CacheHandler } from './handlers/Cache.handler';

dotenv.config();

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
      console.log(req.url)

      // Add request to cache
      const newCache = [
        ...cache,
        {
          method,
          url,
          body: JSON.stringify(body),
          headers: JSON.stringify(responseHeaders),
          response: JSON.stringify(responseBody),
        },
      ];

      fs.writeFileSync(cachePath, JSON.stringify(newCache, null, 4));


      console.log(colors.green(`[✔] Cached response for ${method} ${url}`));
      res.send(responseBody);
    } catch (error) {
      logError(`Error fetching external API: ${error}`);
      res.status(500).send('Error fetching external API');
    }
  }
});

app.listen(ServerConfig.port, ServerConfig.host, () => {
  console.log(`🦜 [ParrotJS Server] running on http://${ServerConfig.host}:${ServerConfig.port}`);
});
