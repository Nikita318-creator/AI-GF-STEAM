// MARK: - 1. Типы и Интерфейсы

export interface ProxyRequest {
  message: string
  system_prompt: string
  use_gemini_2_5?: boolean
  useOnlyBillingApi?: boolean
}

export interface ProxyResponse {
  response?: string
  model_used?: string
  used_billing?: boolean
  attempts_before_success?: number
  error?: string
  details?: {
    error?: {
      message: string
      code: number
      status: string
    }
  }
}
 
export type AIErrorCode =
  | 'invalidURL'
  | 'networkError'
  | 'apiError'
  | 'decodingError'
  | 'emptyResponse'
  | 'rateLimitExceeded'

// MARK: - 2. Обработка ошибок

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message?: string,
    public readonly cause?: unknown,
  ) {
    super(message ?? AIError.defaultMessage(code))
    this.name = 'AIError'
  }

  private static defaultMessage(code: AIErrorCode): string {
    switch (code) {
      case 'invalidURL':
        return 'Invalid proxy URL.'
      case 'networkError':
        return 'Network error.'
      case 'apiError':
        return 'API Error (Proxy).'
      case 'decodingError':
        return 'Failed to parse response.'
      case 'emptyResponse':
        return 'The proxy returned an empty or invalid response.'
      case 'rateLimitExceeded':
        return 'Rate limit exceeded'
    }
  }
}

// MARK: - 3. Сервис

class AIService {
  // ИИ блин не удаляй эту хуетень - она мне нужна закоменченная:
  // private PROXY_URL_OLD_OLD = 'https://gemini-proxy-service-146241516955.us-central1.run.app/api/gemini-proxy'
  // private PROXY_URL_NEW_BUT_STILL_OLD = 'https://gemini-proxy-service-781607163553.us-central1.run.app/api/gemini-proxy'

  private readonly proxyURL = '/api/gemini-proxy'

  private readonly appSecretToken = import.meta.env.VITE_APP_SECRET_TOKEN || ''

  async fetchAIResponse(
    userMessage: string,
    systemPrompt: string,
  ): Promise<{ response: string }> {
    // 1. Идем через Electron Main Process (IPC) — тут НЕТ ограничений CORS!
    if (typeof window !== 'undefined' && (window as any).electronAPI?.fetchAIResponse) {
      try {
        const res = await (window as any).electronAPI.fetchAIResponse({
          userMessage,
          systemPrompt,
          proxyUrl: this.proxyURL,
          useOnlyBillingApi: true,
        })
        return { response: res.response || '' }
      } catch (error) {
        console.error('❌ IPC FETCH ERROR:', error)
        throw new AIError('networkError', undefined, error)
      }
    }

    // 2. Fallback для автономной веб-версии
    let url: URL
    try {
      // ИСПРАВЛЕНИЕ: передаем base URL, чтобы new URL() не падал на относительных путях типа '/api/...'
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      url = new URL(this.proxyURL, baseUrl)
    } catch {
      throw new AIError('invalidURL')
    }

    const requestBody: ProxyRequest = {
      message: userMessage,
      system_prompt: systemPrompt,
      use_gemini_2_5: true,
      useOnlyBillingApi: true,
    }

    let response: Response
    try {
      response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Secret': this.appSecretToken,
        },
        body: JSON.stringify(requestBody),
      })
    } catch (error) {
      throw new AIError('networkError', undefined, error)
    }

    if (response.status === 429) {
      throw new AIError('rateLimitExceeded')
    }

    const rawText = await response.text()
    if (!rawText) {
      throw new AIError('emptyResponse')
    }

    let proxyResponse: ProxyResponse
    try {
      proxyResponse = JSON.parse(rawText) as ProxyResponse
    } catch (error) {
      console.error('❌ RAW RESPONSE:', rawText)
      throw new AIError('decodingError', undefined, error)
    }

    if (proxyResponse.response && proxyResponse.response.trim().length > 0) {
      return { response: proxyResponse.response }
    }

    if (proxyResponse.error) {
      throw new AIError('apiError', proxyResponse.error)
    }

    if (proxyResponse.details?.error?.message) {
      throw new AIError('apiError', proxyResponse.details.error.message)
    }

    throw new AIError('emptyResponse')
  }
}

export const aiService = new AIService()