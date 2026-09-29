// src/services/messageLimitService.ts
import { subscriptionService } from './subscriptionService'

const DAILY_LIMIT = 10
const STORAGE_KEY_COUNT = 'daily_message_count'
const STORAGE_KEY_DATE = 'daily_message_date'

class MessageLimitService {
  /**
   * Возвращает текущую дату в формате YYYY-MM-DD
   */
  private getTodayString(): string {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  /**
   * Получает количество отправленных сообщений за сегодня
   */
  public getTodayCount(): number {
    const savedDate = localStorage.getItem(STORAGE_KEY_DATE)
    const today = this.getTodayString()

    if (savedDate !== today) {
      localStorage.setItem(STORAGE_KEY_DATE, today)
      localStorage.setItem(STORAGE_KEY_COUNT, '0')
      return 0
    }

    const countStr = localStorage.getItem(STORAGE_KEY_COUNT)
    return countStr ? parseInt(countStr, 10) : 0
  }

  /**
   * Увеличивает счетчик отправленных сообщений
   */
  public incrementCount(): number {
    const currentCount = this.getTodayCount()
    const newCount = currentCount + 1
    localStorage.setItem(STORAGE_KEY_COUNT, newCount.toString())
    return newCount
  }

  /**
   * Проверяет, является ли промпт специальным запросом голосового сообщения
   */
  public isAudioMessagePrompt(message: string): boolean {
    return message.trim().toLowerCase() === 'can you send voice messages'
  }

  /**
   * Проверяет, необходимо ли показать Paywall.
   * Условия:
   * 1. Если у пользователя есть подписка — Paywall не показывается.
   * 2. Если пользователь запрашивает аудиосообщение ("Can you send voice messages") — Paywall показывается сразу.
   * 3. Если за сегодня отправлено 10 или больше сообщений — Paywall показывается.
   */
  public shouldShowPaywall(message: string): boolean {
    if (subscriptionService.hasSubscription) {
      return false
    }

    if (this.isAudioMessagePrompt(message)) {
      return true
    }

    const currentCount = this.getTodayCount()
    if (currentCount >= DAILY_LIMIT) {
      return true
    }

    return false
  }
}

export const messageLimitService = new MessageLimitService()