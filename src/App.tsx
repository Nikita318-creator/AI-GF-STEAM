import { useState, useEffect, useCallback } from 'react'
import { ChatList } from '@/components/ChatList'
import { ChatWindow } from '@/components/ChatWindow'
import { ChatInput } from '@/components/ChatInput'
import { Sidebar } from '@/components/Sidebar'
import { TabBar, TabType } from '@/components/TabBar'
import { CreateGfView } from '@/components/CreateGfView'
import { ReelsView, ReelItem } from '@/components/ReelsView'
import { useChat } from '@/hooks/useChat'
import { ttsService } from '@/services/ttsService'
import { feedPool, friendsPool } from '@/components/feedVM'
import type { CharacterRecord, MessageRecord, Character } from '@/types/chat'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chats')
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null)
  const [characters, setCharacters] = useState<CharacterRecord[]>([])
  const [summaries, setSummaries] = useState<Array<{ character: CharacterRecord; lastMessage?: MessageRecord }>>([])
  
  // По умолчанию жестко ставим 'friends'
  const [reelsSubTab, setReelsSubTab] = useState<'friends' | 'feed'>('friends')
  const [reels, setReels] = useState<ReelItem[]>([])

  const activeCharRecord = characters.find((c) => c.id === selectedCharId)

  // 1. Достали sendImageMessage из хука
  const { messages, isTyping, isReady, isAudioMode, sendMessage, sendImageMessage } = useChat(
    selectedCharId,
    activeCharRecord?.avatar
  )

  const loadSummariesAndReels = useCallback(async () => {
    // В зависимости от активной подвкладки выбираем нужный пул
    const targetPool = reelsSubTab === 'friends' ? friendsPool : feedPool
    
    const youtubeReels: ReelItem[] = targetPool.map((url, idx) => ({
      id: `${reelsSubTab}-reel-${idx}`,
      url: url,
      authorName: reelsSubTab === 'friends' ? `Friend #${(idx % 5) + 1}` : `Girlfriend #${(idx % 5) + 1}`,
      authorAvatar: `/photos/pic${(idx % 10) + 1}.jpg`,
      likesCount: Math.floor(Math.random() * 800) + 100,
    }))
    setReels(youtubeReels)

    const api = typeof window !== 'undefined' ? (window.electronAPI as any) : undefined
    if (api && typeof api.getCharacters === 'function') {
      const chars: CharacterRecord[] = await api.getCharacters()
      setCharacters(chars)

      const list = await Promise.all(
        chars.map(async (char: CharacterRecord) => {
          const lastMsg = await api.getLastMessage(char.id)
          return { character: char, lastMessage: lastMsg }
        })
      )

      list.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0
        const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0
        return timeB - timeA
      })

      setSummaries(list)
    }
  }, [reelsSubTab])

  useEffect(() => {
    loadSummariesAndReels()
  }, [loadSummariesAndReels, selectedCharId])

  const activeCharacter: Character | null = activeCharRecord
    ? {
        id: activeCharRecord.id,
        name: activeCharRecord.name,
        avatar: activeCharRecord.avatar || '',
        mood: activeCharRecord.mood || '',
        status: 'online',
      }
    : null

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-glow/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {selectedCharId ? (
          <>
            {activeCharacter && <Sidebar character={activeCharacter} />}
            <main className="relative flex flex-1 flex-col">
              {/* 2. Прокинули onSendGift в ChatWindow */}
              <ChatWindow
                messages={messages}
                characterName={activeCharacter?.name || ''}
                characterAvatar={activeCharacter?.avatar || ''}
                isTyping={isTyping}
                onSendGift={sendImageMessage}
                onBack={() => {
                  ttsService.stop()
                  setSelectedCharId(null)
                  loadSummariesAndReels()
                }}
              />
              <ChatInput
                onSend={sendMessage}
                disabled={isTyping || !isReady}
                isAudioMode={isAudioMode}
                avatar={activeCharacter?.avatar}
              />
            </main>
          </>
        ) : (
          <>
            {activeTab === 'chats' && (
              <ChatList
                chats={summaries}
                onSelectChat={(id) => setSelectedCharId(id)}
              />
            )}
            {activeTab === 'create' && (
              <CreateGfView
                onSelectChat={(id) => {
                  setSelectedCharId(id)
                }}
              />
            )}
            {activeTab === 'reels' && (
              <div className="relative flex-1 h-full w-full">
                {/* Шапка с подвкладками: Friends активна по дефолту */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-black/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setReelsSubTab('friends')}
                    className={`text-sm font-bold transition-all relative ${
                      reelsSubTab === 'friends'
                        ? 'text-white border-b-2 border-white pb-0.5'
                        : 'text-white/40 hover:text-white/80'
                    }`}
                  >
                    Friends
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={() => setReelsSubTab('feed')}
                    className={`text-sm font-bold transition-all relative ${
                      reelsSubTab === 'feed'
                        ? 'text-white border-b-2 border-white pb-0.5'
                        : 'text-white/40 hover:text-white/80'
                    }`}
                  >
                    Feed
                  </button>
                </div>
                <ReelsView reels={reels} />
              </div>
            )}
          </>
        )}
      </div>

      {!selectedCharId && (
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  )
}

export default App