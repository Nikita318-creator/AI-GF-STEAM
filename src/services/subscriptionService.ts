// src/services/subscriptionService.ts

export interface SubscriptionPlan {
    id: 'weekly' | 'monthly' | 'yearly'
    title: string
    price: string
    weeklyPrice?: string
    isBestValue?: boolean
  }
  
  class SubscriptionService {
    private isSubscribed: boolean = false
  
    /**
     * Проверяет, активна ли подписка у пользователя.
     * На текущем этапе возвращает моковый статус (по умолчанию false).
     */
    public async checkSubscriptionStatus(): Promise<boolean> {
      return this.isSubscribed
    }
  
    /**
     * Геттер синхронной проверки статуса
     */
    public get hasSubscription(): boolean {
      return this.isSubscribed
    }
  
    /**
     * Метод для покупки подписки (заглушка для будущего Steam API)
     */
    public async purchasePlan(planId: string): Promise<boolean> {
      console.log(`[SubscriptionService] Attempting purchase for plan: ${planId}`)
      // Пока эмулируем задержку сети/Steam Overlay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // В будущем здесь будет вызов Steam API
      return true
    }
  
    /**
     * Метод для восстановления покупок (для Steam API)
     */
    public async restorePurchases(): Promise<boolean> {
      console.log('[SubscriptionService] Restoring purchases...')
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return true
    }
  }
  
  export const subscriptionService = new SubscriptionService()