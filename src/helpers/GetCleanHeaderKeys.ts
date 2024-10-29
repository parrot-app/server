import { CachedResponseHeader } from '../interfaces/CachedRequest.interface';

/**
 * While in HTTPS, returning the header content-length AND transfer-encoding throws an error.
 * It appears that it's normal, see [this](https://github.com/sindresorhus/got/discussions/1576#discussioncomment-263225)
 */
export const GetCleanHeaderKeys = (headers: CachedResponseHeader): Array<string> => {
  const items = Object.keys(headers).filter(
    (h) => h === 'content-length' || 'transfer-encoding',
  );
  if (items.length > 1) {
    return Object.keys(headers).filter((h) => h !== 'transfer-encoding');
  }
  return [];
};
