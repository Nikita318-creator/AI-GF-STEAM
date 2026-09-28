import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isAudioMode?: boolean
  avatar?: string // Передаем текущий аватар (например, "21.jpg" или "/avatars/21.jpg")
}

const BASE_PROMPT_SUGGESTIONS = [
  "I want to see your photo",
  "I want to get a video of you",
]

export function ChatInput({ onSend, disabled, isAudioMode = false, avatar }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Вспомогательная функция проверки диапазона 21..26
  const isVideoHidden = () => {
    if (!avatar) return false
    const fileName = avatar.split('/').pop()?.toLowerCase() || ''
    const match = fileName.match(/^(\d+)\.jpg$/)
    if (match) {
      const num = parseInt(match[1], 10)
      return num >= 21 && num <= 26
    }
    return false
  }

  // Фильтруем базовые промпты: если диапазон 21..26, убираем запрос видео
  const filteredBasePrompts = BASE_PROMPT_SUGGESTIONS.filter((prompt) => {
    if (isVideoHidden() && prompt === "I want to get a video of you") {
      return false
    }
    return true
  })

  const promptSuggestions = [
    ...filteredBasePrompts,
    isAudioMode ? "Can you send text messages" : "Can you send voice messages",
  ]

  // 1. Аналог becomeFirstResponder() при заплыве в чат
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // 2. Авто-высота textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    
    onSend(trimmed)
    setValue('')

    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (disabled) return
    onSend(suggestion)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div 
      className="border-t border-white/[0.06] bg-surface-raised/60 p-4 backdrop-blur-xl"
      onClick={() => textareaRef.current?.focus()}
    >
      {/* Промпт-подсказки над полем ввода */}
      <div className="mb-3 flex flex-wrap gap-2">
        {promptSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleSuggestionClick(suggestion)
            }}
            disabled={disabled}
            className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-30"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="glass flex items-end gap-3 rounded-2xl p-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="max-h-[120px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-white placeholder-white/30 outline-none"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-glow to-purple-600 text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent/25 disabled:scale-100 disabled:opacity-30 disabled:shadow-none"
          aria-label="Send"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-white/20">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}