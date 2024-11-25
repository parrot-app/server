"use strict";

/**
 * This is a basic example of the matching function you should implement
 * This is how Parrot will match your requests by default.
 * Feel free to customize this function to suit your needs.
 * @param {Express.Request} request the actual request you've sent to Parrot
 * @param {Array<CachedRequest>} cache the full cache array from `requests.json`
 * @returns CachedRequest
 */
function matchBy(request, cache) {
  const cachedRequest = cache.find(
    (cachedRequestItem) =>
      cachedRequestItem.method === request.method &&
      cachedRequestItem.url === request.url,
  );
  return cachedRequest || null;
}

/**
 * This function will get called after your your frontend is received by parrot
 * and before parrot requests at its turn the remote API. It helps you for example
 * change the headers like in this example, add an auth token
 * @param {Express.request} request
 * @returns Express.request
 */
function onBeforeRequest(request) {
  request.headers['authorization'] = 'Bearer AUTH_TOKEN_EXAMPLE';
  return request;
}

module.exports = {
  matchBy,
  onBeforeRequest,
};
