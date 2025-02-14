export interface CachedRequest {
  id: string;
  method: string;
  url: string;
  body: unknown;
  code: number;
  responseHeaders: CachedResponseHeader;
  responseBody: unknown;
  timestamp: Date;
}

export interface CachedResponseHeader {
  [key: string]: string;
}
