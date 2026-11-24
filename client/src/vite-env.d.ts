/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_EVAL_TOOLS?: string;
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
