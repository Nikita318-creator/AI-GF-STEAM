import { DEFAULT_PROXY_URL } from '@/services/ai/aiServiceCore'
import type { RemoteConfig } from './types'

const CONFIG_URL =
  'https://raw.githubusercontent.com/Nikita318-creator/analitics-data/main/analitics629.json'
const CACHE_KEY = 'ai-gf-config-cache'

class ConfigService {
  private baseServer = ''
  private _useOnlyBillingApi = true
  private initialized = false

  get useOnlyBillingApi(): boolean {
    return this._useOnlyBillingApi
  }

  getProxyUrl(): string {
    const envOverride = import.meta.env.VITE_PROXY_URL
    if (envOverride) return envOverride
    return this.baseServer || DEFAULT_PROXY_URL
  }

  async init(): Promise<void> {
    if (this.initialized) return

    this.loadFromCache()

    try {
      const response = await fetch(CONFIG_URL, { cache: 'no-store' })
      if (response.ok) {
        const remote = (await response.json()) as RemoteConfig
        this.applyConfig(remote)
        localStorage.setItem(CACHE_KEY, JSON.stringify(remote))
      }
    } catch {
      // fallback to cache / defaults
    }

    this.initialized = true
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        this.applyConfig(JSON.parse(cached) as RemoteConfig)
      }
    } catch {
      // ignore corrupt cache
    }
  }

  private applyConfig(config: RemoteConfig): void {
    this.baseServer = config.baseServer ?? ''
    this._useOnlyBillingApi = config.useOnlyBillingApi ?? true
  }
}

export const configService = new ConfigService()
