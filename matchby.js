"use strict";

function matchBy(request, cache) {
  const cachedRequest = cache.find(
    (cachedRequestItem) =>
      cachedRequestItem.method === request.method &&
      cachedRequestItem.url === request.url,
  );
  return cachedRequest || null;
}

function onBeforeRequest(request) {
  request.headers['authorization'] = 'Bearer iil7l5OkPw12VqA2tVbmnWAWkqNX';
  return request;
}

module.exports = {
  matchBy,
  onBeforeRequest,
};