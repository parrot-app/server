export interface CachedRequest {
  id: string;
    method: string;
    url: string;
    body: any;
    code: number;
    responseHeaders: CachedResponseHeader;
    responseBody: any;
    timestamp: Date,
}

export interface CachedResponseHeader {
    [key: string]: string;
}
