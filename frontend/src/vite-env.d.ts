/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AXIOM_INGEST_URL?: string;
  readonly VITE_AXIOM_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
