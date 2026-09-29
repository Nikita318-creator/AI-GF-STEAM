const BALANCE_KEY = 'user_coin_balance'

export const coinService = {
  getBalance(): number {
    const saved = localStorage.getItem(BALANCE_KEY)
    if (saved === null) {
      localStorage.setItem(BALANCE_KEY, '10') // стартовый баланс, если нужно
      return 100
    }
    return parseInt(saved, 10) || 0
  },

  addCoins(amount: number): number {
    const current = this.getBalance()
    const updated = current + amount
    localStorage.setItem(BALANCE_KEY, updated.toString())
    return updated
  },

  spendCoins(amount: number): boolean {
    const current = this.getBalance()
    if (current < amount) return false
    localStorage.setItem(BALANCE_KEY, (current - amount).toString())
    return true
  }
}