import { useState, useMemo } from 'react'
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

type CategoryTab = 'gf' | 'anime' | 'milf' | 'ex'

const TABS: { id: CategoryTab; label: string }[] = [
  { id: 'gf', label: 'AI Girls' },
  { id: 'anime', label: 'Anime' },
  { id: 'milf', label: 'MILF' },
  { id: 'ex', label: 'Ex' },
]

const sessionStoryPhotos: Record<string, string> = {}
const sessionViewedStories: Record<string, boolean> = {}

// 1. Сохраняем активный таб на уровне сессии
let sessionActiveTab: CategoryTab = 'gf'

function getAvatarNumber(avatarPath?: string): number {
  if (!avatarPath) return 0
  const fileName = avatarPath.split('/').pop() || ''
  const num = parseInt(fileName, 10)
  return isNaN(num) ? 0 : num
}

function getStoryPhotoForCharacter(characterId: string, avatarPath?: string): string {
  if (sessionStoryPhotos[characterId]) {
    return sessionStoryPhotos[characterId]
  }

  let photoUrl = ''
  const avatarNum = getAvatarNumber(avatarPath)

  const blondeAvatars = [1, 2, 4, 7, 10, 11, 13, 15, 17, 19, 21, 23, 25]
  const brunetteAvatars = [3, 5, 6, 8, 9, 12, 14, 16, 18, 20, 22, 24, 26]

  if (blondeAvatars.includes(avatarNum)) {
    const randomNum = Math.floor(Math.random() * 124) + 1
    photoUrl = `/photos/pic${randomNum}.jpg`
  } else if (brunetteAvatars.includes(avatarNum)) {
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
  // 2. Инициализируем из сохранённого значения
  const [activeTab, setActiveTab] = useState<CategoryTab>(sessionActiveTab)
  const [viewedStories, setViewedStories] = useState<Record<string, boolean>>({ ...sessionViewedStories })
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>('')

  // 3. Функция смены таба, которая обновляет и сессионную переменную
  const handleTabChange = (tab: CategoryTab) => {
    sessionActiveTab = tab
    setActiveTab(tab)
  }

  const storyChats = useMemo(() => {
    return chats.filter(({ character }) => {
      const num = getAvatarNumber(character.avatar)
      return num >= 1 && num <= 10
    })
  }, [chats])

  const filteredChats = useMemo(() => {
    return chats.filter(({ character }) => {
      const num = getAvatarNumber(character.avatar)
      switch (activeTab) {
        case 'gf':
          return num >= 1 && num <= 10
        case 'anime':
          return num >= 11 && num <= 20
        case 'milf':
          return num >= 21 && num <= 25
        case 'ex':
          return num === 26
        default:
          return true
      }
    })
  }, [chats, activeTab])

  const markStoryAsViewed = (charId: string) => {
    sessionViewedStories[charId] = true
    setViewedStories((prev) => ({ ...prev, [charId]: true }))
  }

  const handleOpenStory = (index: number) => {
    const char = storyChats[index]?.character
    if (!char) return

    setActiveStoryIndex(index)
    setCurrentPhotoUrl(getStoryPhotoForCharacter(char.id, char.avatar))
    markStoryAsViewed(char.id)
  }

  const handleNextStory = () => {
    if (activeStoryIndex === null) return
    if (activeStoryIndex < storyChats.length - 1) {
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
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
        <h1 className="font-display text-xl font-bold text-white">Chats</h1>
      </header>

      {/* Stories Bar */}
      {storyChats.length > 0 && (
        <div className="border-b border-white/[0.06] py-3">
          <div className="flex overflow-x-auto px-4 gap-4 justify-center no-scrollbar">
            {storyChats.map(({ character }, index) => {
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
      )}

      {/* iOS Segmented Control */}
      <div className="px-4 py-2 border-b border-white/[0.06] bg-black/10">
        <div className="grid grid-cols-4 rounded-lg bg-neutral-900/80 p-1 border border-white/5 backdrop-blur-md">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`relative rounded-md py-1 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Список чатов */}
      <div className="divide-y divide-white/[0.04] flex-1">
        {filteredChats.length > 0 ? (
          filteredChats.map(({ character, lastMessage }) => (
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
          ))
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-white/30">
            No characters in this category
          </div>
        )}
      </div>

      {/* Модалка истории */}
      {activeStoryIndex !== null && storyChats[activeStoryIndex] && (
        <StoryModal
          character={storyChats[activeStoryIndex].character}
          photoUrl={currentPhotoUrl}
          onClose={() => setActiveStoryIndex(null)}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
        />
      )}
    </div>
  )
}