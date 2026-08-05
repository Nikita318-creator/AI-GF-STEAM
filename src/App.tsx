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
import type { CharacterRecord, MessageRecord, Character } from '@/types/chat'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chats')
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null)
  const [characters, setCharacters] = useState<CharacterRecord[]>([])
  const [summaries, setSummaries] = useState<Array<{ character: CharacterRecord; lastMessage?: MessageRecord }>>([])
  const [reels, setReels] = useState<ReelItem[]>([])

  const activeCharRecord = characters.find((c) => c.id === selectedCharId)

  const { messages, isTyping, isReady, isAudioMode, sendMessage } = useChat(
    selectedCharId,
    activeCharRecord?.avatar
  )

  const loadSummariesAndReels = useCallback(async () => {
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

      // Fetch message history across characters to discover reel video links
     // Fetch message history across characters to discover reel video links
if (typeof api.getMessages === 'function') {
  const extractedReels: ReelItem[] = []
  for (const char of chars) {
    const msgs: MessageRecord[] = await api.getMessages(char.id)
    msgs.forEach((msg, idx) => {
      if (msg.videoUrl) {
        extractedReels.push({
          // Гарантируем уникальный key даже при одинаковых msg.id
          id: `${char.id}-${msg.id || idx}-${idx}`,
          url: msg.videoUrl,
          authorName: char.name,
          authorAvatar: char.avatar,
          likesCount: Math.floor(Math.random() * 500) + 50,
        })
      }
    })
  }
  setReels(extractedReels)
}
    }
  }, [])

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
              <ChatWindow
                messages={messages}
                characterName={activeCharacter?.name || ''}
                characterAvatar={activeCharacter?.avatar || ''}
                isTyping={isTyping}
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
            {activeTab === 'create' && <CreateGfView />}
            {activeTab === 'reels' && <ReelsView reels={reels} />}
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