export interface CachedRequest {
    method: string;
    url: string;
    body: any;
    code: number;
    responseHeaders: CachedResponseHeader;
    responseBody: any;
}

export interface CachedResponseHeader {
    [key: string]: string;
}