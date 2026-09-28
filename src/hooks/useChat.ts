import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message } from '@/types/chat'
import { aiService } from '@/services/ai/aiService'
import { AIError } from '@/services/ai/types'
import { configService } from '@/services/config/configService'
import { ttsService } from '@/services/ttsService'
import {
  GENERIC_ERROR_TEXT,
  RATE_LIMIT_ERROR_TEXT,
  getSystemPrompt,
} from '@/constants/prompts'

export type CharacterCategory = 'gf' | 'anime' | 'milf' | 'ex'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function cleanResponse(text: string): string {
  return text.replace(/\[video\]/g, '').replace(/\[photo\]/g, '').trim()
}

export function getAvatarNumber(avatarPath?: string): number {
  if (!avatarPath) return 0
  const fileName = avatarPath.split('/').pop() || ''
  const num = parseInt(fileName, 10)
  return isNaN(num) ? 0 : num
}

export function getCharacterCategory(avatarPath?: string): CharacterCategory {
  const num = getAvatarNumber(avatarPath)
  if (num >= 11 && num <= 20) return 'anime'
  if (num >= 21 && num <= 25) return 'milf'
  if (num === 26) return 'ex'
  return 'gf'
}

function getRandomPhotoForCharacter(avatarPath?: string): string {
  const category = getCharacterCategory(avatarPath)
  const avatarNum = getAvatarNumber(avatarPath)

  switch (category) {
    case 'anime': {
      // У каждого персонажа (avatarNum) 20 уникальных фоток в общей папке (от 1 до 20)
      const randomPhotoNum = Math.floor(Math.random() * 20) + 1
      return `/photos/${avatarNum}_${randomPhotoNum}.jpg`
    }
    case 'milf': {
      // Пример диапазона/пути для MILF
      const randomPhotoNum = Math.floor(Math.random() * 15) + 1
      return `/photos/${avatarNum}_${randomPhotoNum}.jpg`
    }
    case 'ex': {
      // Пример диапазона/пути для Ex
      const randomNum = Math.floor(Math.random() * 32) + 1
      return `/photos/ex${randomNum}.jpg`
    }
    case 'gf':
    default: {
      // Существующая логика блондинка / брюнетка для реальных аватарок (1..10)
      const blondeAvatars = [1, 2, 4, 7, 10]
      const brunetteAvatars = [3, 5, 6, 8, 9]

      if (blondeAvatars.includes(avatarNum)) {
        const randomNum = Math.floor(Math.random() * 124) + 1
        return `/photos/pic${randomNum}.jpg`
      } else if (brunetteAvatars.includes(avatarNum)) {
        const randomNum = Math.floor(Math.random() * 115) + 1
        return `/photos/photo${randomNum}.jpg`
      } else {
        const randomNum = Math.floor(Math.random() * 124) + 1
        return `/photos/pic${randomNum}.jpg`
      }
    }
  }
}

async function getVideoForCharacter(avatarPath?: string): Promise<string | undefined> {
  const category = getCharacterCategory(avatarPath)
  const api = typeof window !== 'undefined' ? (window.electronAPI as any) : undefined

  // Если Electron API поддерживает передачу категории:
  if (api && typeof api.getVideo === 'function') {
    const fetchedUrl = await api.getVideo(avatarPath, category)
    if (fetchedUrl) return fetchedUrl
  }

  // Фоллбек на локальные папки в зависимости от категории
  switch (category) {
    case 'anime': {
      const randomNum = Math.floor(Math.random() * 10) + 1
      return `/videos/anime/video${randomNum}.mp4`
    }
    case 'milf': {
      const randomNum = Math.floor(Math.random() * 10) + 1
      return `/videos/milf/video${randomNum}.mp4`
    }
    case 'ex': {
      const randomNum = Math.floor(Math.random() * 10) + 1
      return `/videos/ex/video${randomNum}.mp4`
    }
    case 'gf':
    default: {
      const randomNum = Math.floor(Math.random() * 10) + 1
      return `/videos/real/video${randomNum}.mp4`
    }
  }
}

function formatChatHistory(messages: Message[]): string {
  if (!messages || messages.length === 0) return ''
  const recentMessages = messages.slice(-8)
  const formatted = recentMessages
    .map((msg) => {
      const prefix = msg.role === 'assistant' ? '[girlfriend:]' : '[user:]'
      return `${prefix} ${msg.content}`
    })
    .join('\n')

  return `\n\nI am attaching our chat history for context:\n${formatted}`
}

interface RetryContext {
  systemPrompt: string
  previousMessages: string
  userText: string
}

function buildFullMessage(ctx: RetryContext, attempt: number): string {
  const { systemPrompt, previousMessages, userText } = ctx

  switch (attempt) {
    case 0:
    case 1:
      return `${systemPrompt}${previousMessages}\n${userText}`
    case 2:
    case 3:
    default:
      return `${systemPrompt}\n${userText}`
  }
}

const MAX_RETRIES = 7

export function useChat(activeCharacterId: string | null, characterAvatar?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isAudioMode, setIsAudioMode] = useState(false)

  const messagesRef = useRef<Message[]>([])
  messagesRef.current = messages

  const persistMessage = async (msg: Message, charId: string) => {
    const api = typeof window !== 'undefined' ? (window.electronAPI as any) : undefined
    if (api && typeof api.saveMessage === 'function') {
      try {
        const rawTimestamp =
          msg.timestamp instanceof Date
            ? msg.timestamp.getTime()
            : Number(msg.timestamp) || Date.now()

        await api.saveMessage({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: rawTimestamp,
          characterId: charId,
          imageUrl: msg.imageUrl,
          videoUrl: msg.videoUrl,
          isAudio: msg.isAudio ? 1 : 0,
          audioUrl: undefined,
        })
      } catch (err) {
        console.error('Failed to persist message to SQLite:', err)
      }
    }
  }

  useEffect(() => {
    async function loadHistory() {
      setIsAudioMode(false)

      if (!activeCharacterId) {
        setMessages([])
        return
      }

      try {
        const api = typeof window !== 'undefined' ? (window.electronAPI as any) : undefined
        if (api && typeof api.getMessagesByCharacter === 'function') {
          const dbRecords = await api.getMessagesByCharacter(activeCharacterId)
          if (Array.isArray(dbRecords)) {
            const loaded: Message[] = dbRecords.map((rec) => ({
              id: String(rec.id),
              role: rec.role as 'user' | 'assistant',
              content: String(rec.content),
              timestamp: new Date(Number(rec.timestamp)),
              characterId: activeCharacterId,
              imageUrl: rec.imageUrl,
              videoUrl: rec.videoUrl,
              isAudio: Boolean(rec.isAudio),
              audioUrl: undefined,
            }))
            setMessages(loaded)
          }
        }
      } catch (err) {
        console.error('Failed to load history for character:', err)
      } finally {
        await configService.init()
        setIsReady(true)
      }
    }

    loadHistory()
  }, [activeCharacterId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeCharacterId) return

      let currentLayout = 'en-US'
      const api = typeof window !== 'undefined' ? (window.electronAPI as any) : undefined
      if (api && typeof api.getKeyboardLayout === 'function') {
        try {
          currentLayout = await api.getKeyboardLayout()
        } catch (err) {
          console.error('Failed to get layout:', err)
        }
      }

      const lowerText = text.trim().toLowerCase()
      let newAudioMode = isAudioMode

      if (lowerText === 'can you send voice messages'.toLowerCase()) {
        newAudioMode = true
        setIsAudioMode(true)
      } else if (lowerText === 'can you send text messages'.toLowerCase()) {
        newAudioMode = false
        setIsAudioMode(false)
      }

      const shouldBeAudio =
        newAudioMode || lowerText === 'can you send voice messages'.toLowerCase()

      const dynamicPrompt = getSystemPrompt(currentLayout)
      const currentMessages = messagesRef.current
      const formattedHistory = formatChatHistory(currentMessages)

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        characterId: activeCharacterId,
      }

      setMessages((prev) => [...prev, userMessage])
      await persistMessage(userMessage, activeCharacterId)

      setIsTyping(true)

      // Прямой запрос фото ("i want to see your photo")
      if (lowerText === 'i want to see your photo'.toLowerCase()) {
        await new Promise((r) => setTimeout(r, 1500))

        const imageUrl = getRandomPhotoForCharacter(characterAvatar)
        const aiMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          characterId: activeCharacterId,
          imageUrl: imageUrl,
        }

        setMessages((prev) => [...prev, aiMessage])
        await persistMessage(aiMessage, activeCharacterId)
        setIsTyping(false)
        return
      }

      // Прямой запрос видео ("i want to get a video of you")
      if (lowerText === 'i want to get a video of you'.toLowerCase()) {
        await new Promise((r) => setTimeout(r, 2000))

        const videoUrl = await getVideoForCharacter(characterAvatar)

        const aiMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          characterId: activeCharacterId,
          videoUrl: videoUrl,
        }

        setMessages((prev) => [...prev, aiMessage])
        await persistMessage(aiMessage, activeCharacterId)
        setIsTyping(false)
        return
      }

      const ctx: RetryContext = {
        systemPrompt: dynamicPrompt,
        previousMessages: formattedHistory,
        userText: text,
      }

      let lastError: unknown

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 1000))
        }

        try {
          const fullMessage = buildFullMessage(ctx, attempt)
          const result = await aiService.fetchAIResponse(fullMessage, '')
          const rawContent = cleanResponse(result.response)

          let finalContent = rawContent
          let imageUrl: string | undefined = undefined
          let videoUrl: string | undefined = undefined

          // Обработка тега [photo] от ИИ
          if (rawContent.toLowerCase().includes('[photo]')) {
            imageUrl = getRandomPhotoForCharacter(characterAvatar)
            finalContent = rawContent.replace(/\[photo\]/gi, '').trim()
          }

          // Обработка тега [video] от ИИ
          if (rawContent.toLowerCase().includes('[video]')) {
            videoUrl = await getVideoForCharacter(characterAvatar)
            finalContent = rawContent.replace(/\[video\]/gi, '').trim()
          }

          const aiMessageId = generateId()

          const aiMessage: Message = {
            id: aiMessageId,
            role: 'assistant',
            content: finalContent,
            timestamp: new Date(),
            characterId: activeCharacterId,
            imageUrl: imageUrl,
            videoUrl: videoUrl,
            isAudio: shouldBeAudio,
            isAudioLoading: shouldBeAudio,
          }

          setMessages((prev) => [...prev, aiMessage])
          setIsTyping(false)

          if (shouldBeAudio && finalContent) {
            try {
              const audioUrl = await ttsService.synthesizeSpeech(
                finalContent,
                currentLayout
              )
              const updatedMsg = {
                ...aiMessage,
                audioUrl,
                isAudioLoading: false,
              }
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMessageId ? updatedMsg : m))
              )
              await persistMessage(updatedMsg, activeCharacterId)
              ttsService.togglePlay(aiMessageId, audioUrl)
            } catch (ttsErr) {
              console.error('Failed to synthesize speech:', ttsErr)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, isAudioLoading: false } : m
                )
              )
              await persistMessage(aiMessage, activeCharacterId)
            }
          } else {
            await persistMessage(aiMessage, activeCharacterId)
          }

          return
        } catch (error) {
          lastError = error
        }
      }

      const errorText =
        lastError instanceof AIError && lastError.code === 'rateLimitExceeded'
          ? RATE_LIMIT_ERROR_TEXT
          : GENERIC_ERROR_TEXT

      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: errorText,
        timestamp: new Date(),
        characterId: activeCharacterId,
      }

      setMessages((prev) => [...prev, errorMessage])
      await persistMessage(errorMessage, activeCharacterId)
      setIsTyping(false)
    },
    [activeCharacterId, characterAvatar, isAudioMode]
  )

  return {
    messages,
    isTyping,
    isReady,
    isAudioMode,
    sendMessage,
  }
}