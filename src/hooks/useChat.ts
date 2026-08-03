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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function cleanResponse(text: string): string {
  return text.replace(/\[video\]/g, '').replace(/\[photo\]/g, '').trim()
}

function getRandomPhotoForCharacter(avatarPath?: string): string {
  if (!avatarPath) {
    const randomNum = Math.floor(Math.random() * 124) + 1
    return `/photos/pic${randomNum}.jpg`
  }

  const fileName = avatarPath.split('/').pop()?.toLowerCase() || ''
  const blondeAvatars = ['1.jpg', '2.jpg', '4.jpg', '7.jpg', '10.jpg']
  const brunetteAvatars = ['3.jpg', '5.jpg', '6.jpg', '8.jpg', '9.jpg']

  if (blondeAvatars.includes(fileName)) {
    const randomNum = Math.floor(Math.random() * 124) + 1
    return `/photos/pic${randomNum}.jpg`
  } else if (brunetteAvatars.includes(fileName)) {
    const randomNum = Math.floor(Math.random() * 115) + 1
    return `/photos/photo${randomNum}.jpg`
  } else {
    const randomNum = Math.floor(Math.random() * 124) + 1
    return `/photos/pic${randomNum}.jpg`
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

  const isAudioModeRef = useRef<boolean>(false)
  isAudioModeRef.current = isAudioMode

  const persistMessage = async (msg: Message, charId: string) => {
    const api = typeof window !== 'undefined' ? (window.electronAPI as any) : undefined
    if (api && typeof api.saveMessage === 'function') {
      try {
        const rawTimestamp = msg.timestamp instanceof Date 
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
          audioUrl: undefined, // Никогда не сохраняем мертвые blob-ссылки в базу данных
        })
      } catch (err) {
        console.error('Failed to persist message to SQLite:', err)
      }
    }
  }

  useEffect(() => {
    async function loadHistory() {
      // При смене персонажа или выходе из чата сбрасываем режим аудио
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
              audioUrl: undefined, // Очищаем протухшие blob-ссылки при загрузке из базы
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

  const sendMessage = useCallback(async (text: string) => {
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

    // Сначала определяем целевой режим с учетом мгновенного клика по подсказке
    let newAudioMode = isAudioMode

    if (lowerText === 'can you send voice messages'.toLowerCase()) {
      newAudioMode = true
      setIsAudioMode(true)
    } else if (lowerText === 'can you send text messages'.toLowerCase()) {
      newAudioMode = false
      setIsAudioMode(false)
    }

    // Определяем, должно ли текущее сообщение быть аудио
    const shouldBeAudio = newAudioMode || lowerText === 'can you send voice messages'.toLowerCase()

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

    if (lowerText === 'i want to get a video of you'.toLowerCase()) {
      await new Promise((r) => setTimeout(r, 2000))

      let videoUrl: string | undefined = undefined

      if (api && typeof api.getVideo === 'function') {
        const fetchedUrl = await api.getVideo(characterAvatar)
        if (fetchedUrl) videoUrl = fetchedUrl
      }

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

        if (rawContent.toLowerCase().includes('[photo]')) {
          imageUrl = getRandomPhotoForCharacter(characterAvatar)
          finalContent = rawContent.replace(/\[photo\]/gi, '').trim()
        }

        if (rawContent.toLowerCase().includes('[video]')) {
          if (api && typeof api.getVideo === 'function') {
            videoUrl = await api.getVideo(characterAvatar) ?? undefined
          }
          finalContent = rawContent.replace(/\[video\]/gi, '').trim()
        }

        const aiMessageId = generateId()

        // Создаем ИИ-сообщение
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

        // Если активен аудио-режим или был специальный запрос, генерируем речь
        if (shouldBeAudio && finalContent) {
          try {
            const audioUrl = await ttsService.synthesizeSpeech(finalContent, currentLayout)
            const updatedMsg = {
              ...aiMessage,
              audioUrl,
              isAudioLoading: false,
            }
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMessageId ? updatedMsg : m))
            )
            await persistMessage(updatedMsg, activeCharacterId)
            
            // Автоматически проигрываем
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
  }, [activeCharacterId, characterAvatar, isAudioMode])

  return {
    messages,
    isTyping,
    isReady,
    isAudioMode,
    sendMessage,
  }
}