declare global {
  interface MessageRecord {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
    characterId?: string
  }

  interface CharacterRecord {
    id: string
    name: string
    avatar: string
    mood?: string
  }

  interface Window {
    electronAPI: {
      platform: string
      getLocale: () => Promise<string>
      fetchAIResponse: (
        params: import('../../electron/types').FetchAIParams
      ) => Promise<import('../../electron/types').FetchAIResult>
      getMessages: () => Promise<MessageRecord[]>
      saveMessage: (msg: MessageRecord) => Promise<void>
      clearHistory: () => Promise<void>
      
      // Методы для работы с чатами
      getCharacters: () => Promise<CharacterRecord[]>
      getMessagesByCharacter: (characterId: string) => Promise<MessageRecord[]>
      getLastMessage: (characterId: string) => Promise<MessageRecord | undefined>
      getVideo: (avatar?: string) => Promise<string | null>
    }
  }
}

export {}