/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GOOGLE_API_KEY: string;
  readonly PUBLIC_GOOGLE_OAUTH_CLIENT_ID: string;
  readonly PUBLIC_GOOGLE_OAUTH_REDIRECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
