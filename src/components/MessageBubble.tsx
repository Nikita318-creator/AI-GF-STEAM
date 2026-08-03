import { useState, useEffect } from 'react'
import type { Message } from '@/types/chat'
import { PhotoModal } from './PhotoModal'
import { ttsService } from '@/services/ttsService'

interface MessageBubbleProps {
  message: Message
  characterName: string
  characterAvatar: string
}

export function MessageBubble({
  message,
  characterName,
  characterAvatar,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [isPhotoOpen, setIsPhotoOpen] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [localAudioUrl, setLocalAudioUrl] = useState<string | undefined>(message.audioUrl)

  // Синхронизируем локальный URL, если он прилетел из пропсов (свежесозданное сообщение)
  useEffect(() => {
    if (message.audioUrl) {
      setLocalAudioUrl(message.audioUrl)
    }
  }, [message.audioUrl])

  // Подписываемся на изменения состояния плеера
  useEffect(() => {
    const checkState = () => {
      setIsPlaying(ttsService.isPlaying(message.id))
    }
    checkState()
    const unsubscribe = ttsService.subscribe(checkState)
    return () => {
      unsubscribe()
    }
  }, [message.id])

  const handleAudioClick = async () => {
    // Если уже играет или на паузе — просто переключаем
    if (localAudioUrl) {
      ttsService.togglePlay(message.id, localAudioUrl)
      return
    }

    // Если аудио нет (например, перезагрузили прилу) — генерируем на лету по тексту
    if (!message.content) return

    try {
      setIsLoading(true)
      // Определяем язык (если текст на кириллице — русский, иначе английский)
      const isRussian = /[а-яё]/i.test(message.content)
      const lang = isRussian ? 'ru-RU' : 'en-US'

      const newUrl = await ttsService.synthesizeSpeech(message.content, lang)
      setLocalAudioUrl(newUrl)
      ttsService.togglePlay(message.id, newUrl)
    } catch (error) {
      console.error('Failed to generate speech on the fly:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div
        className={`flex animate-slide-up gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {!isUser && (
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
            <img
              src={characterAvatar}
              alt={characterName}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className={`flex max-w-[75%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {!isUser && (
            <span className="mb-1 px-1 text-xs font-medium text-white/40">
              {characterName}
            </span>
          )}

          <div
            className={`relative rounded-2xl p-2 text-[15px] leading-relaxed ${
              isUser
                ? 'rounded-br-md bg-gradient-to-br from-bubble-user to-purple-700 text-white shadow-lg shadow-purple-900/30 px-4 py-3'
                : 'rounded-bl-md bg-bubble-ai text-white/90 ring-1 ring-white/[0.06]'
            }`}
          >
            {/* Картинка */}
            {message.imageUrl && (
              <div
                className="mb-2 overflow-hidden rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setIsPhotoOpen(true)}
              >
                <img
                  src={message.imageUrl}
                  alt="Photo response"
                  className="max-h-80 w-full object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
            )}

            {/* Видео */}
            {message.videoUrl && (
              <div 
                className="mb-2 overflow-hidden rounded-xl cursor-pointer relative group"
                onClick={() => setIsVideoOpen(true)}
              >
                <video
                  src={message.videoUrl}
                  playsInline
                  preload="metadata"
                  loop
                  className="max-h-80 w-full object-cover rounded-xl pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
                    ▶
                  </div>
                </div>
              </div>
            )}

            {/* Аудио Ячейка (Voice Message Player) */}
            {message.isAudio ? (
              <div className="px-3 py-2 min-w-[220px]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={message.isAudioLoading || isLoading}
                    onClick={handleAudioClick}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-glow/20 hover:bg-accent-glow/30 text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {message.isAudioLoading || isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    ) : isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  <div className="flex flex-1 flex-col gap-1">
                    {/* Визуализатор звуковой волны */}
                    <div className="flex h-6 items-center gap-1">
                      {[35, 65, 40, 85, 95, 45, 75, 55, 30, 70, 90, 60, 40, 80, 50, 30].map((height, i) => (
                        <span
                          key={i}
                          className={`w-0.5 rounded-full transition-all duration-300 ${
                            isPlaying
                              ? 'bg-accent-glow animate-pulse'
                              : 'bg-white/30'
                          }`}
                          style={{
                            height: `${height}%`,
                            animationDelay: `${(i % 5) * 150}ms`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-white/40">
                      {message.isAudioLoading || isLoading ? 'Voice message generating...' : 'Voice message'}
                    </span>
                  </div>
                </div>

                {/* Субтитры под аудио-сообщением */}
                {message.content.length > 0 && (
                  <p className="mt-2 text-xs text-white/70 border-t border-white/5 pt-2 whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </div>
            ) : (
              /* Обычное текстовое сообщение */
              message.content.length > 0 && (
                <p className="whitespace-pre-wrap break-words px-2 py-1">{message.content}</p>
              )
            )}
          </div>

          <time className="mt-1.5 px-1 text-[11px] text-white/25">
            {formatTime(message.timestamp)}
          </time>
        </div>
      </div>

      {/* Полноэкранные модалки */}
      {isPhotoOpen && message.imageUrl && (
        <PhotoModal
          imageUrl={message.imageUrl}
          onClose={() => setIsPhotoOpen(false)}
        />
      )}

      {isVideoOpen && message.videoUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsVideoOpen(false)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={message.videoUrl}
              controls
              autoPlay
              playsInline
              loop
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white text-3xl font-light px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function formatTime(timestamp: Date | string | number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}