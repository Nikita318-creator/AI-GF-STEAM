interface PaywallModalProps {
    onClose: () => void
    onBuyCoins: (amount: number) => void
  }
  
  const COIN_PACKS = [
    { coins: 20, price: '$0.99', icon: '/photos/coin20.jpg' }, 
    { coins: 100, price: '$2.99', icon: '/photos/coin100.jpg' },
    { coins: 1000, price: '$4.99', icon: '/photos/coin1000.jpg' },
  ]
  
  export function PaywallModal({ onClose, onBuyCoins }: PaywallModalProps) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="relative flex w-full max-w-md flex-col rounded-3xl border border-white/10 bg-surface-dark/95 p-6 shadow-2xl backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-display text-xl font-bold text-white">Get More Coins</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
  
          <div className="grid grid-cols-3 gap-3">
            {COIN_PACKS.map((pack) => (
              <div
                key={pack.coins}
                className="flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition-all hover:border-purple-500/50 hover:bg-white/10"
              >
                <img
                  src={pack.icon}
                  alt={`${pack.coins} coins`}
                  className="h-12 w-12 object-contain mb-2"
                  onError={(e) => {
                    // фоллбэк на эмодзи, если картинка ещё не загружена
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
                <span className="text-lg font-bold text-white mb-1">🪙 {pack.coins}</span>
                <button
                  type="button"
                  onClick={() => {
                    onBuyCoins(pack.coins)
                    onClose()
                  }}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  Buy for {pack.price}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }