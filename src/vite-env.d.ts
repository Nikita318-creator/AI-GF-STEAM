/// <reference types="vite/client" />

import type { FetchAIParams, FetchAIResult } from '@/services/ai/types'

export interface ElectronAPI {
  platform: string
  fetchAIResponse?: (params: FetchAIParams) => Promise<FetchAIResult>
}

interface ImportMetaEnv {
  readonly VITE_AUTH_TOKEN?: string
  readonly VITE_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
