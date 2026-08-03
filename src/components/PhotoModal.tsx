import { useState, useRef, useEffect, useCallback } from 'react'

interface PhotoModalProps {
  imageUrl: string
  onClose: () => void
}

export function PhotoModal({ imageUrl, onClose }: PhotoModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const imgRef = useRef<HTMLImageElement>(null)

  // Закрытие по клавише Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Масштабирование (Wheel / Touchpad Pinch)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.005
    setScale((prevScale) => {
      const newScale = Math.min(Math.max(1, prevScale + delta), 2) // Ограничение 1x .. 2x
      if (newScale === 1) setPosition({ x: 0, y: 0 }) // Сброс позиции при 1x
      return newScale
    })
  }, [])

  // Перетаскивание увеличенного изображения
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Скачивание файла на компьютер
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    const fileName = imageUrl.split('/').pop() || 'photo.jpg'
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none"
      onClick={onClose}
    >
      {/* Кнопка Закрыть в правом верхнем углу */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        title="Close (Esc)"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Кнопка Скачать внизу по центру */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDownload()
        }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 ring-1 ring-white/20"
        title="Download photo"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {/* Контейнер картинки */}
      <div
        className="relative flex items-center justify-center max-w-full max-h-full p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Full screen photo"
          className="max-h-[85vh] max-w-[90vw] object-contain transition-transform ease-out duration-75 cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
    </div>
  )
}