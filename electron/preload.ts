// НЕ используем import/export вообще, чтобы tsc не добавлял "export {}" в выходной файл

interface MessageRecordLocal {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  characterId?: string
  imageUrl?: string
  videoUrl?: string
  isAudio?: number | boolean
  audioUrl?: string
}

interface CharacterRecordLocal {
  id: string
  name: string
  avatar: string
  mood?: string
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  getLocale: (): Promise<string> =>
    ipcRenderer.invoke('system:get-locale'),

  getKeyboardLayout: (): Promise<string> =>
    ipcRenderer.invoke('get-keyboard-layout'),

  fetchAIResponse: (params: any): Promise<any> =>
    ipcRenderer.invoke('ai:fetch', params),

  getMessages: (): Promise<MessageRecordLocal[]> =>
    ipcRenderer.invoke('db:get-messages'),

  saveMessage: (msg: MessageRecordLocal): Promise<void> =>
    ipcRenderer.invoke('db:save-message', msg),

  clearHistory: (): Promise<void> =>
    ipcRenderer.invoke('db:clear-history'),

  getCharacters: (): Promise<CharacterRecordLocal[]> =>
    ipcRenderer.invoke('db:get-characters'),

  getMessagesByCharacter: (characterId: string): Promise<MessageRecordLocal[]> =>
    ipcRenderer.invoke('db:get-messages-by-character', characterId),

  getLastMessage: (characterId: string): Promise<MessageRecordLocal | undefined> =>
    ipcRenderer.invoke('db:get-last-message', characterId),

  getVideo: (avatar?: string): Promise<string | null> =>
    ipcRenderer.invoke('video:get', avatar),
})