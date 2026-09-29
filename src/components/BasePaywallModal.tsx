// src/components/BasePaywallModal.tsx

import React, { useState } from 'react'
import { subscriptionService } from '@/services/subscriptionService'

interface BasePaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessPurchase?: () => void
  title?: string
  subtitle?: string
}

type PlanType = 'weekly' | 'yearly'

const PRIVACY_AND_TERMS_URL = 'https://sites.google.com/view/aicgprivacy/'

export const BasePaywallModal: React.FC<BasePaywallModalProps> = ({
  isOpen,
  onClose,
  onSuccessPurchase,
  title = 'Unlock Unlimited Access',
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handlePurchase = async () => {
    setIsLoading(true)
    try {
      const success = await subscriptionService.purchasePlan(selectedPlan)
      if (success) {
        if (onSuccessPurchase) onSuccessPurchase()
        onClose()
      }
    } catch (error) {
      console.error('Purchase failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    setIsLoading(true)
    try {
      await subscriptionService.restorePurchases()
      onClose()
    } catch (error) {
      console.error('Restore failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      {/* Главная карточка Paywall (адаптированная под 16:9/десктоп) */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-b from-[#2C2C2E] via-[#1A1A1A] to-[#000000] border border-white/10 shadow-2xl text-white">
        
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/80 transition-colors hover:bg-black/70 hover:text-white"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 p-8 gap-8 items-center">
          
          {/* Левая колонка: Иконка/Аватар и Бенефиты */}
          <div className="md:col-span-5 flex flex-col items-center text-center md:items-start md:text-left">
            <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-white/10 shadow-lg">
              <img
                src="/avatars/1.jpg"
                alt="Premium Companion"
                className="h-full w-full object-cover"
              />
            </div>

            <h2 className="text-2xl font-bold leading-tight mb-4">{title}</h2>

            {/* Список преимуществ */}
            <ul className="space-y-2 text-sm text-white/90 font-medium">
              <li className="flex items-center gap-2">
                ❤️ Unlock exclusive photos and videos
              </li>
              <li className="flex items-center gap-2">
                🔥 Message without any limits
              </li>
              <li className="flex items-center gap-2">
                😍 Design your perfect AI girlfriend
              </li>
              <li className="flex items-center gap-2">
                💕 Dive into profound conversations
              </li>
              <li className="flex items-center gap-2">
                💖 Receive voice messages
              </li>
            </ul>
          </div>

          {/* Правая колонка: Выбор планов и покупка */}
          <div className="md:col-span-7 flex flex-col justify-center space-y-5">
            
            {/* Карточки подписок */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              
              {/* Weekly Plan */}
              <div
                onClick={() => setSelectedPlan('weekly')}
                className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 border ${
                  selectedPlan === 'weekly'
                    ? 'border-[#3390EC] bg-[#333333] shadow-lg shadow-blue-500/10'
                    : 'border-[#3A3A3A] bg-[#2A2A2A] hover:bg-[#303030]'
                }`}
              >
                <div className="text-xs font-semibold text-white/70 mb-1">Weekly Plan</div>
                <div className="text-xl font-bold text-[#3390EC]">$4.99</div>
                <div className="text-xs text-white/40 mt-1">per week</div>

                {selectedPlan === 'weekly' && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#3390EC] flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>

              {/* Yearly Plan (Best Value) */}
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 border ${
                  selectedPlan === 'yearly'
                    ? 'border-[#3390EC] bg-[#333333] shadow-lg shadow-blue-500/10'
                    : 'border-[#3A3A3A] bg-[#2A2A2A] hover:bg-[#303030]'
                }`}
              >
                {/* Badge Best Value */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF6B35] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                  Best Value
                </div>

                <div className="text-xs font-semibold text-white/70 mb-1">Yearly Access</div>
                <div className="text-xl font-bold text-[#34C759]">$29.99</div>
                <div className="text-xs text-[#80A0C0] mt-1">$0.57 / week</div>

                {selectedPlan === 'yearly' && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#3390EC] flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>

            </div>

            {/* Текст отмены */}
            <p className="text-center text-xs text-white/50">
              Cancel anytime in Steam
            </p>

            {/* Главная кнопка продолжения */}
            <button
              onClick={handlePurchase}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg active:scale-95 disabled:opacity-50 ${
                selectedPlan === 'yearly'
                  ? 'bg-[#34C759] hover:bg-[#2fb24f] text-white shadow-green-900/30'
                  : 'bg-[#007AFF] hover:bg-[#0066cc] text-white shadow-blue-900/30'
              }`}
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </button>

            {/* Нижние мелкие ссылки */}
            <div className="flex justify-center gap-6 text-xs text-white/40 pt-1">
              <button onClick={handleRestore} className="hover:text-white/70">
                Restore Purchases
              </button>
              <span>•</span>
              <a
                href={PRIVACY_AND_TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/70"
              >
                Terms of Use
              </a>
              <span>•</span>
              <a
                href={PRIVACY_AND_TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/70"
              >
                Privacy Policy
              </a>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}