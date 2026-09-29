import { useState, useEffect } from 'react'
import { coinService } from '../services/coinService' // проверь путь к файлу
import { PaywallModal } from './PaywallModal' // проверь путь к файлу

interface GiftModalProps {
  onClose: () => void
  onSelectGift: (giftUrl: string) => void
}

const GIFT_PRICES = [5, 6, 7, 10, 15, 20, 30, 40, 50, 100]

const GIFTS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  price: GIFT_PRICES[i],
  imageUrl: `/photos/giftPrize${i + 1}.jpg`,
}))

export function GiftModal({ onClose, onSelectGift }: GiftModalProps) {
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [showAlert, setShowAlert] = useState<boolean>(false)
  const [showPaywall, setShowPaywall] = useState<boolean>(false)

  useEffect(() => {
    setBalance(coinService.getBalance())
  }, [])

  const selectedGift = GIFTS.find((g) => g.id === selectedGiftId)

  const handleSend = () => {
    if (!selectedGift) return

    if (balance < selectedGift.price) {
      setShowAlert(true)
      return
    }

    const success = coinService.spendCoins(selectedGift.price)
    if (success) {
      setBalance(coinService.getBalance())
      onSelectGift(selectedGift.imageUrl)
      onClose()
    }
  }

  const handleAlertConfirm = () => {
    setShowAlert(false)
    setShowPaywall(true)
  }

  const handleBuyCoins = (amount: number) => {
    const updated = coinService.addCoins(amount)
    setBalance(updated)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-hidden"
        onClick={onClose}
      >
        <div
          className="relative flex max-h-[85vh] h-full w-full max-w-lg flex-col rounded-3xl border border-white/10 bg-surface-dark/95 p-6 shadow-2xl backdrop-blur-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Шапка с балансом */}
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <h2 className="font-display text-xl font-bold text-white">Send a Gift</h2>
            </div>
  
            <div className="flex items-center gap-3">
              {/* Balance Badge */}
              <div
                onClick={() => setShowPaywall(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20 transition-all"
              >
                <span>🪙</span>
                <span>{balance}</span>
                <span className="text-xs opacity-60">+</span>
              </div>
  
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
  
          {/* Сетка подарков (Строгий UICollectionView с честным вертикальным скроллом) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-[140px] p-1">
              {GIFTS.map((gift) => {
                const isSelected = selectedGiftId === gift.id
                return (
                  <div
                    key={gift.id}
                    onClick={() => setSelectedGiftId(gift.id)}
                    className={`group relative h-[140px] w-full cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                      isSelected
                        ? 'border-purple-500 ring-4 ring-purple-500/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={gift.imageUrl}
                      alt={`Gift cost ${gift.price}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Ценник */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-yellow-400 backdrop-blur-sm border border-yellow-500/20">
                        🪙 {gift.price}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
  
          {/* Кнопка отправки */}
          <div className="mt-4 border-t border-white/10 pt-4 shrink-0">
            <button
              type="button"
              disabled={!selectedGiftId}
              onClick={handleSend}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            >
              {selectedGift ? `Send Gift (🪙 ${selectedGift.price})` : 'Select a Gift'}
            </button>
          </div>
        </div>
      </div>

      {/* Alert modal */}
      {showAlert && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface-dark/95 p-6 shadow-2xl backdrop-blur-xl text-center">
            <div className="text-4xl mb-3">🪙</div>
            <h3 className="text-lg font-bold text-white mb-2">Not enough coins</h3>
            <p className="text-sm text-white/70 mb-6">
              You don't have enough coins on your balance to send this gift.
            </p>
            <button
              type="button"
              onClick={handleAlertConfirm}
              className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Paywall modal */}
      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          onBuyCoins={handleBuyCoins}
        />
      )}
    </>
  )
}