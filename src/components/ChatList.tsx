import { useState } from 'react'
import type { CharacterRecord, MessageRecord } from '@/types/chat'
import { StoryModal } from './StoryModal'

interface ChatSummary {
  character: CharacterRecord
  lastMessage?: MessageRecord
}

interface ChatListProps {
  chats: ChatSummary[]
  onSelectChat: (characterId: string) => void
}

// Кэш в памяти JS-модуля (живет, пока запущен процесс приложения).
// При навигации между чатами НЕ сбрасывается.
// При закрытии/перезапуске приложения полностью сбрасывается.
const sessionStoryPhotos: Record<string, string> = {}
const sessionViewedStories: Record<string, boolean> = {}

// Функция подбора рандомной фотки с фиксацией в рамках сессии
function getStoryPhotoForCharacter(characterId: string, avatarPath?: string): string {
  if (sessionStoryPhotos[characterId]) {
    return sessionStoryPhotos[characterId]
  }

  let photoUrl = ''
  const fileName = avatarPath?.split('/').pop()?.toLowerCase() || ''
  const blondeAvatars = ['1.jpg', '2.jpg', '4.jpg', '7.jpg', '10.jpg']
  const brunetteAvatars = ['3.jpg', '5.jpg', '6.jpg', '8.jpg', '9.jpg']

  if (blondeAvatars.includes(fileName)) {
    const randomNum = Math.floor(Math.random() * 124) + 1
    photoUrl = `/photos/pic${randomNum}.jpg`
  } else if (brunetteAvatars.includes(fileName)) {
    const randomNum = Math.floor(Math.random() * 115) + 1
    photoUrl = `/photos/photo${randomNum}.jpg`
  } else {
    const randomNum = Math.floor(Math.random() * 124) + 1
    photoUrl = `/photos/pic${randomNum}.jpg`
  }

  sessionStoryPhotos[characterId] = photoUrl
  return photoUrl
}

export function ChatList({ chats, onSelectChat }: ChatListProps) {
  // Инициализируем локальный рендер-стейт данными из сессионного кэша
  const [viewedStories, setViewedStories] = useState<Record<string, boolean>>({ ...sessionViewedStories })
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>('')

  const markStoryAsViewed = (charId: string) => {
    // Обновляем и модуль-кэш, и локальный стейт для перерисовки
    sessionViewedStories[charId] = true
    setViewedStories((prev) => ({ ...prev, [charId]: true }))
  }

  const handleOpenStory = (index: number) => {
    const char = chats[index]?.character
    if (!char) return

    setActiveStoryIndex(index)
    setCurrentPhotoUrl(getStoryPhotoForCharacter(char.id, char.avatar))
    markStoryAsViewed(char.id)
  }

  const handleNextStory = () => {
    if (activeStoryIndex === null) return
    if (activeStoryIndex < chats.length - 1) {
      handleOpenStory(activeStoryIndex + 1)
    } else {
      setActiveStoryIndex(null)
    }
  }

  const handlePrevStory = () => {
    if (activeStoryIndex === null) return
    if (activeStoryIndex > 0) {
      handleOpenStory(activeStoryIndex - 1)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-surface-dark select-none">
      <header className="flex h-14 shrink-0 items-center border-b border-white/[0.06] px-6">
        <h1 className="font-display text-xl font-bold text-white">Chats</h1>
      </header>

      {/* Telegram-style Stories Bar (Отцентрованный контейнер) */}
      <div className="border-b border-white/[0.06] py-3">
        <div className="flex overflow-x-auto px-4 gap-4 justify-center no-scrollbar">
          {chats.map(({ character }, index) => {
            const isViewed = !!viewedStories[character.id]
            return (
              <button
                key={`story-${character.id}`}
                onClick={() => handleOpenStory(index)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div
                  className={`relative h-14 w-14 rounded-full p-[2px] transition-all duration-300 ${
                    isViewed
                      ? 'bg-neutral-700/60 ring-1 ring-white/10'
                      : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 animate-gradient'
                  }`}
                >
                  <div className="h-full w-full rounded-full overflow-hidden bg-neutral-900 border border-black/40">
                    <img
                      src={character.avatar}
                      alt={character.name}
                      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        isViewed ? 'opacity-70' : 'opacity-100'
                      }`}
                    />
                  </div>
                </div>
                <span className={`text-[11px] truncate max-w-[60px] ${isViewed ? 'text-white/40' : 'text-white/90 font-medium'}`}>
                  {character.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Список чатов */}
      <div className="divide-y divide-white/[0.04]">
        {chats.map(({ character, lastMessage }) => (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelectChat(character.id)}
            className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-white/[0.04]"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
              <img
                src={character.avatar}
                alt={character.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{character.name}</span>
                {lastMessage && (
                  <span className="text-[11px] text-white/30">
                    {new Date(lastMessage.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-white/40">
                {lastMessage ? lastMessage.content : 'No messages yet...'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Модалка истории */}
      {activeStoryIndex !== null && chats[activeStoryIndex] && (
        <StoryModal
          character={chats[activeStoryIndex].character}
          photoUrl={currentPhotoUrl}
          onClose={() => setActiveStoryIndex(null)}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
        />
      )}
    </div>
  )
}