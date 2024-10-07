export interface CachedRequest {
    method: string;
    url: string;
    body?: any;
    code?: number;
    headers?: [key: string, value: string] | string;
    response: any;
}