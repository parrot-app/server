export interface StoredCachedRequest {
  id: string;
  method: string;
  url: string;
  body: string;
  code: number;
  responseHeaders: string;
  responseBody: string | undefined;
  timestamp: number;
}
