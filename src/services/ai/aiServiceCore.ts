import {
  AIError,
  type FetchAIParams,
  type FetchAIResult,
  type ProxyRequest,
  type ProxyResponse,
} from './types'

export const DEFAULT_PROXY_URL =
  'https://gemini-proxy-service-138319918962.us-central1.run.app/api/gemini-proxy'

const FALLBACK_MOCK_TEXT = "о мой милый мальчик аоао я даже не знаю что тут ответить"

export async function fetchAIResponse(
  params: FetchAIParams,
  authToken: string,
): Promise<FetchAIResult> {
  const { userMessage, systemPrompt, proxyUrl, useOnlyBillingApi } = params

  try {
    let url: URL
    try {
      url = new URL(proxyUrl)
    } catch {
      throw new AIError('invalidURL')
    }

    const requestBody: ProxyRequest = {
      message: userMessage,
      system_prompt: systemPrompt,
      use_gemini_2_5: true,
      useOnlyBillingApi: useOnlyBillingApi,
    }

    let response: Response
    try {
      response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Secret': authToken,
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
      return { response: FALLBACK_MOCK_TEXT }
    }

    let proxyResponse: ProxyResponse
    try {
      proxyResponse = JSON.parse(rawText) as ProxyResponse
    } catch (error) {
      console.error('RAW RESPONSE:', rawText)
      return { response: FALLBACK_MOCK_TEXT }
    }

    console.log('proxyResponse:', proxyResponse)

    if (proxyResponse.response && proxyResponse.response.trim().length > 0) {
      return {
        response: proxyResponse.response.trim(),
        modelUsed: proxyResponse.model_used,
        usedBilling: proxyResponse.used_billing,
        attemptsBeforeSuccess: proxyResponse.attempts_before_success,
      }
    }

    return { response: FALLBACK_MOCK_TEXT }

  } catch (err) {
    console.error('❌ fetchAIResponse handled error with fallback:', err)
    return { response: FALLBACK_MOCK_TEXT }
  }
}