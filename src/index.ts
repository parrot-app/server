import express from 'express';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import colors from 'colors';
import { CachedRequest } from './interfaces/CachedRequest.interface';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
const port = 3000;

const apiBaseUrl = process.env.API_BASE; // from .env file
const gracefulFail = process.env.GRACEFUL_FAIL || true;

const cachePath = `${process.cwd()}/cache/requests.json`;

// Initialize cache file
if (!fs.existsSync(cachePath)) {
  fs.writeFileSync(cachePath, '[]');
}

app.use(async (req, res, next) => {
  const { method, url, headers, body } = req;
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

  // Check if cache file exists
  const cachedRequest = cache.find((request: CachedRequest) =>
    request.method === method && request.url === url
  );

  if (cachedRequest) {
    // Return cached response
    console.log(colors.green(`[➡] Using cached response for ${method} ${url}`));
    const headers = JSON.parse(cachedRequest.headers)
    if (headers && Object.keys(headers).length > 0) {
      Object.keys(headers).map(key => {
        res.setHeader(key, headers[key]);
      });
    }
    res.send(cachedRequest.response);
  } else {
    // Call external API and cache response
    const externalUrl = `${apiBaseUrl}${url}`;
    console.log(colors.cyan(`[⬅] Fetching external API: ${externalUrl}`));
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
      console.error(`[❌] Error fetching external API: ${error}`);
      res.status(500).send('Error fetching external API');
    }
  }
});

app.listen(port, () => {
  console.log(`🦜 [ParrotJS Server] running on http://localhost:${port}`);
});
