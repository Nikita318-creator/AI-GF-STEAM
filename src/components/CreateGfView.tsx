import React, { useState, useEffect } from 'react'
import { CreateGfModal } from './CreateGfModal'

export interface CreatedGf {
  id: string
  name: string
  role: string
  category: 'AI Girls' | 'Anime' | 'MILF' | 'Ex'
  avatar: string
  status: 'Active' | 'Draft'
  description: string
}

interface CreateGfViewProps {
  onSelectChat?: (characterId: string) => void
}

// Массив романтичных и живых фраз от ИИ-подружки
const CREATIVE_DESCRIPTIONS = [
  "Hey babe, I missed you so much today... Come chat with me! ❤️",
  "I've been thinking about you all day long... What are we doing today?",
  "Your personal cutie is online and ready to keep you company~ ✨",
  "Ready to whisper sweet thoughts in your ear all night long...",
  "Can't wait to hear about your day! Tell me everything, sweetheart 💕",
  "Always here for you, no matter what. Let's make some memories!",
  "Just waiting for my favorite human... Is that you? 😘",
  "I saved a special warm smile just for you today~"
]

export function CreateGfView({ onSelectChat }: CreateGfViewProps) {
  const [gfs, setGfs] = useState<CreatedGf[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. Загрузка персонажей из базы при старте
  // 1. Загрузка персонажей из базы при старте
useEffect(() => {
  const loadCharacters = async () => {
    try {
      if (window.electronAPI?.getCharacters) {
        const dbChars = await window.electronAPI.getCharacters()
        
        const allowedAvatarRegex = /myGF[1-8](\.[a-z]+)?$/i

        const formatted: CreatedGf[] = dbChars
          .filter((char) => allowedAvatarRegex.test(char.avatar))
          .map((char) => ({
            id: char.id,
            name: char.name,
            role: 'Your Ideal AI Girlfriend',
            category: 'AI Girls',
            avatar: char.avatar,
            status: 'Active',
            // ВСЕГДА берем случайную фразу из массива, полностью игнорируя БД
            description:
              CREATIVE_DESCRIPTIONS[
                Math.floor(Math.random() * CREATIVE_DESCRIPTIONS.length)
              ],
          }))

        setGfs(formatted)
      }
    } catch (err) {
      console.error('Failed to load characters from DB:', err)
    }
  }

  loadCharacters()
}, [])

  // 2. Сохранение нового персонажа и первого сообщения
  const handleCreatedNewGf = async (newGf: CreatedGf) => {
    try {
      if (window.electronAPI?.addCharacter) {
        await window.electronAPI.addCharacter({
          id: newGf.id,
          name: newGf.name,
          avatar: newGf.avatar,
          mood: newGf.description,
        })
      }

      if (window.electronAPI?.saveMessage) {
        await window.electronAPI.saveMessage({
          id: `msg_init_${Date.now()}`,
          role: 'assistant',
          content: `Hey master... I'm ${newGf.name}. I was waiting for you! ❤️`,
          timestamp: Date.now(),
          characterId: newGf.id,
        })
      }

      // Приводим созданного персонажа к нужному формату роли
      const updatedNewGf: CreatedGf = {
        ...newGf,
        role: 'Your Ideal AI Girlfriend',
      }

      setGfs((prev) => [updatedNewGf, ...prev])

      if (onSelectChat) {
        onSelectChat(newGf.id)
      }
    } catch (err) {
      console.error('Failed to save character:', err)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-6 overflow-y-auto bg-surface-dark/50 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Create Your Ideal GF</h1>
          <p className="text-sm text-white/60">
            Design your dream companion, shape her personality, and start chatting
          </p>
        </div>
        {gfs.length > 0 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
          >
            + Create New
          </button>
        )}
      </div>

      {gfs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-neutral-900/30 my-auto min-h-[360px]">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-600/20 flex items-center justify-center mb-4 ring-1 ring-pink-500/30">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-display">No AI Girlfriends Created Yet</h2>
          <p className="text-sm text-white/40 max-w-md mb-6">
            You haven't created any AI girlfriends yet. Click the button below to build your first custom companion and start chatting!
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
          >
            + Create New Girlfriend
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {gfs.map((gf) => (
            <div
              key={gf.id}
              onClick={() => onSelectChat?.(gf.id)}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-neutral-900/60 p-4 backdrop-blur-md cursor-pointer transition-all hover:border-pink-500/40 hover:bg-neutral-900/80 hover:shadow-lg hover:shadow-pink-500/5 group"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 bg-neutral-800 transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={gf.avatar}
                      alt={gf.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/avatars/1.jpg'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate group-hover:text-pink-400 transition-colors">
                        {gf.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold text-white/30 px-2 py-0.5 rounded bg-white/5">
                        {gf.category}
                      </span>
                    </div>
                    <p className="text-xs text-pink-400 font-medium truncate">{gf.role}</p>
                  </div>
                </div>

                <p className="text-xs text-white/50 line-clamp-2 mb-4">
                  {gf.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onSelectChat) onSelectChat(gf.id)
                  }}
                  className="text-xs font-medium text-white/40 hover:text-white transition"
                >
                  Open Chat →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateGfModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreatedNewGf}
      />
    </div>
  )
}