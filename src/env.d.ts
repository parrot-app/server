// env.d.ts
interface EnvConfig {
  PARROT_PORT: number;
  PARROT_API_BASE: string;
  PARROT_GRACEFUL_FAIL: string;
  PARROT_CACHEPATH: string;
  PARROT_LOG: string;
  PARROT_LOGPATH: string;
  PARROT_CACHE_FILENAME: string;
  PARROT_CACHE_FILE_ENCODING: string;
  PARROT_REJECT_UNAUTHORIZED: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends EnvConfig {}
  }
}

export {};
