export interface StoredCachedRequest {
    method: string;
    url: string;
    body: string;
    code: number;
    responseHeaders: string;
    responseBody: any;
}