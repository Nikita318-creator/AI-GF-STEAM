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
  details?: ProxyErrorDetails
}

export interface ProxyErrorDetails {
  error?: {
    message: string
    code: number
    status: string
  }
}

export type AIErrorCode =
  | 'invalidURL'
  | 'networkError'
  | 'apiError'
  | 'decodingError'
  | 'emptyResponse'
  | 'rateLimitExceeded'

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message?: string,
    public readonly cause?: unknown,
  ) {
    super(message ?? AIError.defaultMessage(code))
    this.name = 'AIError'
  }

  static defaultMessage(code: AIErrorCode): string {
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

export interface FetchAIParams {
  userMessage: string
  systemPrompt: string
  proxyUrl: string
  useOnlyBillingApi: boolean
}

export interface FetchAIResult {
  response: string
  modelUsed?: string
  usedBilling?: boolean
  attemptsBeforeSuccess?: number
}
