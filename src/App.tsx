import { useState, useEffect, useCallback } from 'react'
import { ChatList } from '@/components/ChatList'
import { ChatWindow } from '@/components/ChatWindow'
import { ChatInput } from '@/components/ChatInput'
import { Sidebar } from '@/components/Sidebar'
import { useChat } from '@/hooks/useChat'
import { ttsService } from '@/services/ttsService'
import type { CharacterRecord, MessageRecord, Character } from '@/types/chat'

export function App() {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null)
  const [characters, setCharacters] = useState<CharacterRecord[]>([])
  const [summaries, setSummaries] = useState<Array<{ character: CharacterRecord; lastMessage?: MessageRecord }>>([])

  // 1. Ищем выбранного персонажа до вызова useChat
  const activeCharRecord = characters.find((c) => c.id === selectedCharId)

  // 2. Передаем и ID, и путь к аватарке, а также достаем isAudioMode
  const { messages, isTyping, isReady, isAudioMode, sendMessage } = useChat(
    selectedCharId,
    activeCharRecord?.avatar
  )

  const loadSummaries = useCallback(async () => {
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

      // Сортировка: наверху чаты с самыми свежими сообщениями
      list.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0
        const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0
        return timeB - timeA
      })

      setSummaries(list)
    }
  }, [])

  useEffect(() => {
    loadSummaries()
  }, [loadSummaries, selectedCharId])

  // Преобразуем CharacterRecord в Character с гарантированными значениями для TS
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
    <div className="flex h-full w-full">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-glow/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {!selectedCharId ? (
        <ChatList
          chats={summaries}
          onSelectChat={(id) => setSelectedCharId(id)}
        />
      ) : (
        <>
          {activeCharacter && <Sidebar character={activeCharacter} />}

          <main className="relative flex flex-1 flex-col">
            <ChatWindow
              messages={messages}
              characterName={activeCharacter?.name || ''}
              characterAvatar={activeCharacter?.avatar || ''}
              isTyping={isTyping}
              onBack={() => {
                ttsService.stop() // Останавливаем озвучку при выходе из чата
                setSelectedCharId(null)
                loadSummaries()
              }}
            />
            <ChatInput
              onSend={sendMessage}
              disabled={isTyping || !isReady}
              isAudioMode={isAudioMode}
            />
          </main>
        </>
      )}
    </div>
  )
}

export default App