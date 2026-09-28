/// <reference types="vite/client" />

import type { FetchAIParams, FetchAIResult } from '@/services/ai/types'

export interface MessageRecordLocal {
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

export interface CharacterRecordLocal {
  id: string
  name: string
  avatar: string
  mood?: string
}

export interface ElectronAPI {
  platform: string
  getLocale?: () => Promise<string>
  getKeyboardLayout?: () => Promise<string>
  fetchAIResponse?: (params: FetchAIParams) => Promise<FetchAIResult>
  getMessages?: () => Promise<MessageRecordLocal[]>
  saveMessage?: (msg: MessageRecordLocal) => Promise<void>
  clearHistory?: () => Promise<void>
  getCharacters?: () => Promise<CharacterRecordLocal[]>
  addCharacter?: (char: CharacterRecordLocal) => Promise<void>
  getMessagesByCharacter?: (characterId: string) => Promise<MessageRecordLocal[]>
  getLastMessage?: (characterId: string) => Promise<MessageRecordLocal | undefined>
  getVideo?: (avatar?: string) => Promise<string | null>
}

interface ImportMetaEnv {
  readonly VITE_AUTH_TOKEN?: string
  readonly VITE_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}