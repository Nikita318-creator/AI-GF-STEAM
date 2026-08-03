const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY || ''

export interface VoiceConfig {
  langTag: string
  voiceName: string
  pitch?: number
}

// Конфигурация голосов по умолчанию
export function getVoiceConfig(lang: string = 'en-US'): VoiceConfig {
  if (lang.startsWith('ru')) {
    return {
      langTag: 'ru-RU',
      voiceName: 'ru-RU-Wavenet-C',
      pitch: 1.0,
    }
  }
  return {
    langTag: 'en-US',
    voiceName: 'en-US-Neural2-F',
    pitch: 1.0,
  }
}

class TTSService {
  private currentAudio: HTMLAudioElement | null = null
  private currentAudioUrl: string | null = null
  private activeMessageId: string | null = null
  private listeners: Set<() => void> = new Set()

  public subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  public getActiveMessageId(): string | null {
    return this.activeMessageId
  }

  public isPlaying(messageId: string): boolean {
    return (
      this.activeMessageId === messageId &&
      !!this.currentAudio &&
      !this.currentAudio.paused &&
      !this.currentAudio.ended
    )
  }

  public async synthesizeSpeech(text: string, lang: string = 'en-US'): Promise<string> {
    const cleanText = text.replace(/~/g, '')
    const voiceConfig = getVoiceConfig(lang)

    const audioConfig: Record<string, any> = {
      audioEncoding: 'MP3',
      speakingRate: 1.05,
    }

    if (voiceConfig.pitch !== undefined) {
      audioConfig.pitch = voiceConfig.pitch
    }

    const requestBody = {
      input: { text: cleanText },
      voice: {
        languageCode: voiceConfig.langTag,
        name: voiceConfig.voiceName,
      },
      audioConfig,
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Google TTS Error: ${errorData}`)
    }

    const data = await response.json()
    if (!data.audioContent) {
      throw new Error('No audioContent received from Google TTS')
    }

    // Переводим base64 в blob URL для проигрывания в теге Audio
    const byteCharacters = atob(data.audioContent)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'audio/mp3' })

    return URL.createObjectURL(blob)
  }

  public togglePlay(messageId: string, audioUrl: string) {
    if (this.activeMessageId === messageId && this.currentAudio) {
      if (this.currentAudio.paused) {
        this.currentAudio.play().catch(console.error)
      } else {
        this.currentAudio.pause()
      }
      this.notify()
      return
    }

    this.stop()

    const audio = new Audio(audioUrl)
    this.currentAudio = audio
    this.currentAudioUrl = audioUrl
    this.activeMessageId = messageId

    audio.onplay = () => this.notify()
    audio.onpause = () => this.notify()
    audio.onended = () => {
      this.activeMessageId = null
      this.notify()
    }
    audio.onerror = () => {
      this.activeMessageId = null
      this.notify()
    }

    audio.play().catch(console.error)
    this.notify()
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    if (this.currentAudioUrl && this.currentAudioUrl.startsWith('blob:')) {
      // Освобождаем память при необходимости
    }
    this.activeMessageId = null
    this.notify()
  }
}

export const ttsService = new TTSService()