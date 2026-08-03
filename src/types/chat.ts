export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  characterId?: string
  imageUrl?: string
  videoUrl?: string
  isAudio?: boolean
  audioUrl?: string
  isAudioLoading?: boolean
}

export interface Character {
  id: string
  name: string
  avatar: string
  mood: string
  status: 'online' | 'away'
}

export interface MessageRecord {
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

export interface CharacterRecord {
  id: string
  name: string
  avatar?: string
  mood?: string
}