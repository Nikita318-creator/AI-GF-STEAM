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

  // Таймер прогресса (останавливается при isPaused === true)
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
        return prev + 2 // 5 секунд
      })
    }, 100)

    return () => clearInterval(interval)
  }, [photoUrl, isPaused, onNext, onClose])

  // Сбрасываем прогресс при смене фото
  useEffect(() => {
    setProgress(0)
    setIsPaused(false)
    preventClickRef.current = false
  }, [photoUrl])

  // Начало нажатия
  const handlePressStart = () => {
    preventClickRef.current = false
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true
      setIsPaused(true)
    }, 150) // Задержка для определения Long Press
  }

  // Завершение нажатия / отпускание мыши
  const handlePressEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
    }

    if (isHoldingRef.current) {
      // Был лонг-тап: блокируем ближайший клик и снимаем паузу
      preventClickRef.current = true
      isHoldingRef.current = false
      setIsPaused(false)

      // Снимаем блокировку клика через короткий промежуток
      setTimeout(() => {
        preventClickRef.current = false
      }, 100)
    }
  }

  const handleClickLeft = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Нажимаем "Назад" только если НЕ было долгого удержания
    if (!preventClickRef.current && onPrev) {
      onPrev()
    }
  }

  const handleClickRight = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Нажимаем "Вперед" только если НЕ было долгого удержания
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

        {/* Хедер с аватаркой и именем */}
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

        {/* Контент сторис (картинка) */}
        <div className="relative h-full w-full bg-black">
          <img
            src={photoUrl}
            alt={`${character.name} story`}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Область кликов и удержания */}
        <div
          className="absolute inset-0 z-10 flex cursor-pointer"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {/* Левая половина (назад) */}
          <div className="w-1/3 h-full" onClick={handleClickLeft} />
          
          {/* Правая половина (вперед) */}
          <div className="w-2/3 h-full" onClick={handleClickRight} />
        </div>
      </div>
    </div>
  )
}