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
}

export function ChatWindow({
  messages,
  characterName,
  characterAvatar,
  isTyping,
  onBack,
  onSendGift,
  onDeleteMessage,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false)

  // Надежный скролл вниз: отрабатывает при монтировании, изменении сообщений и догрузке любых картинок
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight
    }

    // 1. Мгновенный скролл
    scrollToBottom()

    // 2. Скролл после завершения текущего кадра layout
    const rafId = requestAnimationFrame(scrollToBottom)

    // 3. Отслеживание асинхронной загрузки картинок (аватарки, медиа в бабблах)
    const handleImageLoad = (e: Event) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        scrollToBottom()
      }
    }

    // 4. Отслеживание изменений размера контента
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

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-surface-dark">
      {/* 1. Фоновое изображение (backgroundImageView) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={characterAvatar}
          alt={characterName}
          className="h-full w-full object-cover blur-[2px] scale-105"
        />
        {/* 2. Полупрозрачный черный слой поверх фото (backgroundOverlayView) */}
        <div className="absolute inset-0 bg-black/60" />
        {/* 3. Градиентный слой (gradientLayer) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* Основной контент поверх слоев фона */}
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
            {/* Оставлена только иконка подарка */}
            <HeaderButton
              icon="🎁"
              label="Gift"
              onClick={() => setIsGiftModalOpen(true)}
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