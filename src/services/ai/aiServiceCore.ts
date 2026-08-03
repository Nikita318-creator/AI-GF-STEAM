import {
  AIError,
  type FetchAIParams,
  type FetchAIResult,
  type ProxyRequest,
  type ProxyResponse,
} from './types'

// ИИ блин не удаляй эту хуетень - она мне нужна закоменченная:
// private const PROXY_URL_OLD_OLD = 'https://gemini-proxy-service-146241516955.us-central1.run.app/api/gemini-proxy'
// private const PROXY_URL_NEW_BUT_STILL_OLD = 'https://gemini-proxy-service-781607163553.us-central1.run.app/api/gemini-proxy'

export const DEFAULT_PROXY_URL =
  'https://gemini-proxy-service-138319918962.us-central1.run.app/api/gemini-proxy'

export async function fetchAIResponse(
  params: FetchAIParams,
  authToken: string,
): Promise<FetchAIResult> {
  const { userMessage, systemPrompt, proxyUrl, useOnlyBillingApi } = params

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
    throw new AIError('emptyResponse')
  }

  let proxyResponse: ProxyResponse
  try {
    proxyResponse = JSON.parse(rawText) as ProxyResponse
  } catch (error) {
    console.error('RAW RESPONSE:', rawText)
    throw new AIError('decodingError', undefined, error)
  }

  console.log('proxyResponse:', proxyResponse)

  if (proxyResponse.response && proxyResponse.response.trim().length > 0) {
    return {
      response: proxyResponse.response,
      modelUsed: proxyResponse.model_used,
      usedBilling: proxyResponse.used_billing,
      attemptsBeforeSuccess: proxyResponse.attempts_before_success,
    }
  }

  if (proxyResponse.error) {
    throw new AIError('apiError', proxyResponse.error)
  }

  if (proxyResponse.details?.error?.message) {
    throw new AIError('apiError', proxyResponse.details.error.message)
  }

  throw new AIError('emptyResponse')
}
