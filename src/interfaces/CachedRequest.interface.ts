export interface CachedRequest {
    method: string;
    url: string;
    body?: any;
    code?: number;
    headers?: string;
    response: any;
}