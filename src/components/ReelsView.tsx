import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Heart as HeartIcon,
  Volume2 as Volume2Icon,
  VolumeX as VolumeXIcon,
  ChevronDown as ChevronDownIcon,
  User as UserIcon,
  Loader2 as LoaderIcon,
  Play as PlayIcon,
} from 'lucide-react'
import { extractVideoId, feedPool } from './feedVM'

export interface ReelItem {
  id: string
  url: string
  authorName: string
  authorAvatar?: string
  likesCount?: number
}

interface ReelsViewProps {
  reels?: ReelItem[]
}

function getRandomReel(pool: ReelItem[] | string[], indexOffset: number): ReelItem {
  if (pool.length === 0) {
    return {
      id: `random-${Date.now()}-${indexOffset}`,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      authorName: 'Girlfriend',
      authorAvatar: '/photos/pic1.jpg',
      likesCount: 150,
    }
  }

  const raw = pool[Math.floor(Math.random() * pool.length)]
  const url = typeof raw === 'string' ? raw : raw.url
  const authorName = typeof raw === 'string' ? `Girlfriend #${(indexOffset % 5) + 1}` : raw.authorName
  const authorAvatar = typeof raw === 'string' ? `/photos/pic${(indexOffset % 10) + 1}.jpg` : raw.authorAvatar

  return {
    id: `reel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${indexOffset}`,
    url: url,
    authorName: authorName,
    authorAvatar: authorAvatar,
    likesCount: Math.floor(Math.random() * 800) + 100,
  }
}

export const ReelsView: React.FC<ReelsViewProps> = ({ reels: initialReels = [] }) => {
  const [items, setItems] = useState<ReelItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({})
  
  // Глобальный звук для всех видео
  const [isMuted, setIsMuted] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const sourcePoolRef = useRef<ReelItem[] | string[]>(feedPool)

  useEffect(() => {
    const pool = initialReels.length > 0 ? initialReels : feedPool
    sourcePoolRef.current = pool

    const initialItems: ReelItem[] = []
    for (let i = 0; i < 10; i++) {
      initialItems.push(getRandomReel(pool, i))
    }
    setItems(initialItems)

    const initialLikes: Record<string, number> = {}
    initialItems.forEach((r) => {
      initialLikes[r.id] = r.likesCount ?? Math.floor(Math.random() * 800) + 100
    })
    setLikesCountMap(initialLikes)
  }, [initialReels])

  const appendMoreItems = useCallback(() => {
    setItems((prev) => {
      const newBatch: ReelItem[] = []
      for (let i = 0; i < 5; i++) {
        newBatch.push(getRandomReel(sourcePoolRef.current, prev.length + i))
      }
      return [...prev, ...newBatch]
    })
  }, [])

  const handleScroll = () => {
    if (!containerRef.current) return
    const height = containerRef.current.clientHeight
    if (height === 0) return
    const newIndex = Math.round(containerRef.current.scrollTop / height)
    
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < items.length) {
      setActiveIndex(newIndex)
    }

    if (newIndex >= items.length - 3) {
      appendMoreItems()
    }
  }

  const handleVideoError = useCallback(
    (failedIndex: number) => {
      console.warn(`[ReelsView] Video at index ${failedIndex} failed or restricted. Skipping to next.`)
      appendMoreItems()

      if (containerRef.current) {
        const nextIndex = failedIndex + 1
        const height = containerRef.current.clientHeight
        containerRef.current.scrollTo({
          top: nextIndex * height,
          behavior: 'smooth',
        })
      }
    },
    [appendMoreItems]
  )

  const toggleLike = useCallback((reel: ReelItem) => {
    const isCurrentlyLiked = !!likedMap[reel.id]
    const nextLiked = !isCurrentlyLiked

    setLikedMap((prev) => ({
      ...prev,
      [reel.id]: nextLiked,
    }))

    setLikesCountMap((prev) => {
      const currentCount = prev[reel.id] ?? reel.likesCount ?? 0
      return {
        ...prev,
        [reel.id]: currentCount + (nextLiked ? 1 : -1),
      }
    })
  }, [likedMap])

  const handleToggleMuteGlobal = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  if (!items || items.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-400">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-snap snap-y snap-mandatory overflow-y-auto bg-black relative select-none"
    >
      {items.map((reel, index) => (
        <ReelCard
          key={reel.id}
          index={index}
          reel={reel}
          isFirst={index === 0}
          isActive={index === activeIndex}
          isMuted={isMuted}
          onToggleMute={handleToggleMuteGlobal}
          isLiked={!!likedMap[reel.id]}
          likesCount={likesCountMap[reel.id] ?? reel.likesCount ?? 0}
          onToggleLike={() => toggleLike(reel)}
          onError={() => handleVideoError(index)}
        />
      ))}
    </div>
  )
}

interface ReelCardProps {
  index: number
  reel: ReelItem
  isFirst: boolean
  isActive: boolean
  isMuted: boolean
  onToggleMute: () => void
  isLiked: boolean
  likesCount: number
  onToggleLike: () => void
  onError: () => void
}

const ReelCard: React.FC<ReelCardProps> = memo(({
  index,
  reel,
  isFirst,
  isActive,
  isMuted,
  onToggleMute,
  isLiked,
  likesCount,
  onToggleLike,
  onError,
}) => {
  const videoId = extractVideoId(reel.url)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sendIframeCommand = useCallback((func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      )
    }
  }, [])

  useEffect(() => {
    if (isActive && isIframeLoaded) {
      sendIframeCommand(isMuted ? 'mute' : 'unMute')
    }
  }, [isActive, isIframeLoaded, isMuted, sendIframeCommand])

  const handleTogglePlay = () => {
    const nextPlaying = !isPlaying
    setIsPlaying(nextPlaying)
    sendIframeCommand(nextPlaying ? 'playVideo' : 'pauseVideo')
  }

  const handleToggleMuteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleMute()
  }

  const handleToggleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleLike()
  }

  useEffect(() => {
    if (isFirst && isActive) {
      const timer = setTimeout(() => {
        setShowScrollHint(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isFirst, isActive])

  useEffect(() => {
    if (!videoId) return

    const maxRes = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    const fallback = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

    const img = new Image()
    img.src = maxRes
    img.onload = () => {
      if (img.width === 120) {
        setPreviewUrl(fallback)
      } else {
        setPreviewUrl(maxRes)
      }
    }
    img.onerror = () => {
      setPreviewUrl(fallback)
    }
  }, [videoId])

  useEffect(() => {
    if (!videoId && isActive) {
      onError()
    }
  }, [videoId, isActive, onError])

  if (!videoId) return null

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0&enablejsapi=1`

  return (
    <div className="relative h-full w-full snap-start snap-always overflow-hidden bg-black flex items-center justify-center">
      <div className="relative h-full aspect-[9/16] max-w-full bg-gray-950 overflow-hidden flex items-center justify-center shadow-2xl">
        
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 z-0 ${
              isIframeLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {!isIframeLoaded && (
          <div className="absolute z-10 flex items-center justify-center">
            <LoaderIcon className="h-10 w-10 text-white animate-spin opacity-80" />
          </div>
        )}

        {isActive && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title="YouTube Video"
            allow="autoplay; encrypted-media; picture-in-picture"
            className="absolute w-full h-full object-cover scale-[1.21] border-0 pointer-events-none z-5"
            onLoad={() => setIsIframeLoaded(true)}
            onError={onError}
          />
        )}

        {/* Прозрачное одеяло для Play/Pause */}
        <div onClick={handleTogglePlay} className="absolute inset-0 cursor-pointer z-10" />

        {/* Иконка паузы по центру */}
        {!isPlaying && (
          <div className="absolute z-20 pointer-events-none rounded-full bg-black/50 p-5 backdrop-blur-md transition-all animate-in fade-in zoom-in-75">
            <PlayIcon className="h-10 w-10 text-white fill-white translate-x-0.5" />
          </div>
        )}

        {/* Кнопка звука */}
        <button
          onClick={handleToggleMuteClick}
          className="absolute top-6 right-6 z-20 rounded-full bg-black/40 p-3 text-white backdrop-blur-md hover:bg-black/60 transition-colors active:scale-95"
        >
          {isMuted ? <VolumeXIcon className="h-6 w-6" /> : <Volume2Icon className="h-6 w-6" />}
        </button>

        {/* Инфо об авторе */}
        <div className="absolute bottom-6 left-4 right-16 z-20 flex items-center gap-3 pointer-events-none">
          {reel.authorAvatar ? (
            <img
              src={reel.authorAvatar}
              alt={reel.authorName}
              className="h-10 w-10 rounded-full border-2 border-white/20 object-cover shadow-lg"
            />
          ) : (
            <div className="h-10 w-10 rounded-full border-2 border-white/20 bg-gray-800 flex items-center justify-center text-white shadow-lg">
              <UserIcon className="h-5 w-5" />
            </div>
          )}
          <span className="font-semibold text-white drop-shadow-md text-sm">{reel.authorName}</span>
        </div>

        {/* Кнопка Лайка */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-1">
          <button
            onClick={handleToggleLikeClick}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md active:scale-90 transition-transform hover:bg-black/60"
          >
            <HeartIcon className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <span className="text-xs font-medium text-white drop-shadow-md">{likesCount}</span>
        </div>

        {isFirst && isActive && showScrollHint && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md animate-bounce pointer-events-none transition-opacity duration-500">
            <span className="text-xs text-white/90 font-medium">Scroll down for next video</span>
            <ChevronDownIcon className="h-4 w-4 text-white/90" />
          </div>
        )}
      </div>
    </div>
  )
})