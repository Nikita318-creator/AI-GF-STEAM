import { useEffect, useState, useRef } from 'react'
import type { CharacterRecord } from '@/types/chat'

interface StoryModalProps {
  character: CharacterRecord
  photoUrl: string
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
}

export function StoryModal({ character, photoUrl, onClose, onNext, onPrev }: StoryModalProps) {
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const isHoldingRef = useRef(false)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
  const preventClickRef = useRef(false)

  // Данные для свайпа (Drag / Touch Swipe)
  const touchStartXRef = useRef<number | null>(null)
  const isSwipingRef = useRef(false)

  // 1. Таймер прогресса (автопереключение через 5 секунд)
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          if (onNext) {
            onNext()
          } else {
            onClose()
          }
          return 100
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [photoUrl, isPaused, onNext, onClose])

  // 2. Сброс состояния при смене фото
  useEffect(() => {
    setProgress(0)
    setIsPaused(false)
    preventClickRef.current = false
    touchStartXRef.current = null
    isSwipingRef.current = false
  }, [photoUrl])

  // 3. Управление клавиатурой (Стрелки влево/вправо и Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (onNext) onNext()
        else onClose()
      } else if (e.key === 'ArrowLeft') {
        if (onPrev) onPrev()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onPrev, onClose])

  // --- ОБРАБОТКА НАЖАТИЙ И СВАЙПОВ ---

  const handlePointerStart = (clientX: number) => {
    preventClickRef.current = false
    touchStartXRef.current = clientX
    isSwipingRef.current = false

    // Запускаем таймер Long Press (пауза при удержании)
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true
      setIsPaused(true)
    }, 150)
  }

  const handlePointerMove = (clientX: number) => {
    if (touchStartXRef.current === null) return

    const diffX = clientX - touchStartXRef.current

    // Если сдвиг по горизонтали больше 10px, считаем это за свайп
    if (Math.abs(diffX) > 10) {
      isSwipingRef.current = true

      // Если начался свайп — отменяем Long Press паузу
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
      }
      if (isHoldingRef.current) {
        isHoldingRef.current = false
        setIsPaused(false)
      }
    }
  }

  const handlePointerEnd = (clientX: number) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
    }

    // Если был свайп — проверяем дистанцию
    if (isSwipingRef.current && touchStartXRef.current !== null) {
      const diffX = clientX - touchStartXRef.current
      const SWIPE_THRESHOLD = 50 // Минимальное расстояние для свайпа (в px)

      preventClickRef.current = true // Блокируем последующий клик

      if (diffX < -SWIPE_THRESHOLD) {
        // Свайп влево -> Следующая история
        if (onNext) onNext()
        else onClose()
      } else if (diffX > SWIPE_THRESHOLD) {
        // Свайп вправо -> Предыдущая история
        if (onPrev) onPrev()
      }
    }

    // Если был Long Press
    if (isHoldingRef.current) {
      preventClickRef.current = true
      isHoldingRef.current = false
      setIsPaused(false)

      setTimeout(() => {
        preventClickRef.current = false
      }, 100)
    }

    touchStartXRef.current = null
    isSwipingRef.current = false
  }

  // Обработчики кликов по областям
  const handleClickLeft = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!preventClickRef.current && onPrev) {
      onPrev()
    }
  }

  const handleClickRight = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!preventClickRef.current) {
      if (onNext) onNext()
      else onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative flex h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl">
        
        {/* Прогресс-бар сверху */}
        <div className={`absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 transition-opacity duration-200 ${isPaused ? 'opacity-0' : 'opacity-100'}`}>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Хедер */}
        <div className={`absolute top-5 left-0 right-0 z-20 flex items-center justify-between px-4 transition-opacity duration-200 ${isPaused ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-pink-500/80">
              <img src={character.avatar} alt={character.name} className="h-full w-full object-cover" />
            </div>
            <span className="font-medium text-white shadow-sm">{character.name}</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            ✕
          </button>
        </div>

        {/* Контент сторис */}
        <div className="relative h-full w-full bg-black">
          <img
            src={photoUrl}
            alt={`${character.name} story`}
            className="h-full w-full object-cover pointer-events-none"
          />
        </div>

        {/* Интерактивная область (Клики, Пауза, Свайпы) */}
        <div
          className="absolute inset-0 z-10 flex cursor-pointer"
          onMouseDown={(e) => handlePointerStart(e.clientX)}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={(e) => handlePointerEnd(e.clientX)}
          onMouseLeave={(e) => handlePointerEnd(e.clientX)}
          onTouchStart={(e) => handlePointerStart(e.touches[0].clientX)}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={(e) => handlePointerEnd(e.changedTouches[0].clientX)}
        >
          {/* Левая треть (назад) */}
          <div className="w-1/3 h-full" onClick={handleClickLeft} />
          
          {/* Правые две трети (вперед) */}
          <div className="w-2/3 h-full" onClick={handleClickRight} />
        </div>
      </div>
    </div>
  )
}