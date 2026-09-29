import { useRef, useEffect, useState } from 'react'
import type { Message } from '@/types/chat'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { PhotoModal } from './PhotoModal'
import { GiftModal } from '@/components/GiftModal'

interface ChatWindowProps {
  messages: Message[]
  characterName: string
  characterAvatar: string
  isTyping: boolean
  onBack: () => void
  onSendGift?: (giftUrl: string) => void
  onDeleteMessage?: (id: string) => void
  onClearHistory?: () => Promise<void> | void
}

export function ChatWindow({
  messages,
  characterName,
  characterAvatar,
  isTyping,
  onBack,
  onSendGift,
  onDeleteMessage,
  onClearHistory,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false)
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight
    }

    scrollToBottom()

    const rafId = requestAnimationFrame(scrollToBottom)

    const handleImageLoad = (e: Event) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        scrollToBottom()
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      scrollToBottom()
    })

    el.addEventListener('load', handleImageLoad, true)
    resizeObserver.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('load', handleImageLoad, true)
      resizeObserver.disconnect()
    }
  }, [messages, isTyping])

  const handleConfirmClear = async () => {
    setIsClearAlertOpen(false)
    if (onClearHistory) {
      await onClearHistory()
    }
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-surface-dark">
      {/* 1. Фоновое изображение */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={characterAvatar}
          alt={characterName}
          className="h-full w-full object-cover blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* Основной контент */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/20 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
              title="Back"
            >
              ←
            </button>
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                <img
                  src={characterAvatar}
                  alt={characterName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h1 className="font-display text-base font-semibold text-white">
                  {characterName}
                </h1>
                <p className="text-xs text-white/50">Online</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <HeaderButton
              icon="🎁"
              label="Gift"
              onClick={() => setIsGiftModalOpen(true)}
            />
            <HeaderButton
              icon="🗑️"
              label="Clear History"
              onClick={() => setIsClearAlertOpen(true)}
            />
          </div>
        </header>

        {/* Список сообщений */}
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5"
        >
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div
                className="mb-4 h-24 w-24 overflow-hidden rounded-full ring-4 ring-white/20 shadow-2xl cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                <img
                  src={characterAvatar}
                  alt={characterName}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="font-display text-lg font-medium text-white drop-shadow">
                Start a conversation with {characterName}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              characterName={characterName}
              characterAvatar={characterAvatar}
              onDelete={onDeleteMessage}
            />
          ))}

          {isTyping && <TypingIndicator characterAvatar={characterAvatar} />}
        </div>
      </div>

      {/* Полноэкранное фото аватарки */}
      {isAvatarModalOpen && (
        <PhotoModal
          imageUrl={characterAvatar}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}

      {/* Модальное окно выбора подарков */}
      {isGiftModalOpen && (
        <GiftModal
          onClose={() => setIsGiftModalOpen(false)}
          onSelectGift={(giftUrl) => {
            if (onSendGift) {
              onSendGift(giftUrl)
            }
          }}
        />
      )}

      {/* Нативный кастомный алерт под стиль приложения */}
      {isClearAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 p-6 text-center shadow-2xl backdrop-blur-2xl transition-all animate-in zoom-in-95 duration-200">
            {/* Иконка-акцент */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl border border-red-500/20 text-red-400">
              🗑️
            </div>

            {/* Заголовок и Текст */}
            <h3 className="font-display text-lg font-semibold text-white">
              Clear Chat History?
            </h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Are you sure you want to clear all history with{' '}
              <span className="font-medium text-white">{characterName}</span>?
              This action cannot be undone.
            </p>

            {/* Кнопки действия */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsClearAlertOpen(false)}
                className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 active:scale-95"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeaderButton({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm backdrop-blur-md transition-colors hover:bg-white/20 active:scale-95"
    >
      {icon}
    </button>
  )
}