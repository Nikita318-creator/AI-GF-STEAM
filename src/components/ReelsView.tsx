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

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

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

const REALISTIC_NICKNAMES = [
  'vibe_check',
  'soft.girl.era',
  'no_context_m',
  'draining.core',
  'night.drive.vibes',
  'main.character. energy',
  'sad_boy_club',
  'latenight.thoughts',
  'cozy_corner',
  'daily.dose.of.chill',
  'aesthetic_junkie',
  'lost_in_tokyo',
  'retro_futurism',
  'urban_explorer',
  'coffee_and_code',
  'mindful.moments',
  'afterhours.session',
  'velvet.sky',
  'broken.record',
  'silent_vogue',
  'digital.archive',
  'lofi_moods',
  'chasing_sunsets',
  'neon_reflections',
  'raw_captures',
  'pure.nostalgia',
  'street_canvas',
  'subtle.flex',
  'endless_scroll',
  'parallel.universe',
]

function getRandomNickname(): string {
  return REALISTIC_NICKNAMES[Math.floor(Math.random() * REALISTIC_NICKNAMES.length)]
}

function getRandomReel(pool: ReelItem[] | string[], indexOffset: number): ReelItem {
  const randomNick = getRandomNickname()

  if (pool.length === 0) {
    return {
      id: `random-${Date.now()}-${indexOffset}`,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      authorName: randomNick,
      authorAvatar: `/photos/pic${(indexOffset % 10) + 1}.jpg`,
      likesCount: Math.floor(Math.random() * 800) + 100,
    }
  }

  const raw = pool[Math.floor(Math.random() * pool.length)]
  const url = typeof raw === 'string' ? raw : raw.url
  
  // Жестко перезаписываем любые старые моки Girlfriend/friend
  let authorName = typeof raw === 'string' ? randomNick : raw.authorName
  if (!authorName || authorName.toLowerCase().includes('friend')) {
    authorName = randomNick
  }

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
  
  const [isMuted, setIsMuted] = useState(true)
  const [isApiReady, setIsApiReady] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const sourcePoolRef = useRef<ReelItem[] | string[]>(feedPool)

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true)
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      console.log('🚀 [YT API] YouTube IFrame API Ready')
      setIsApiReady(true)
    }
  }, [])

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
    (failedIndex: number, reason: string) => {
      console.warn(`🚨 [ReelsView] Auto-skipping video at index [${failedIndex}]. Reason: ${reason}`)
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
          isApiReady={isApiReady}
          isMuted={isMuted}
          onToggleMute={handleToggleMuteGlobal}
          isLiked={!!likedMap[reel.id]}
          likesCount={likesCountMap[reel.id] ?? reel.likesCount ?? 0}
          onToggleLike={() => toggleLike(reel)}
          onError={(reason) => handleVideoError(index, reason)}
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
  isApiReady: boolean
  isMuted: boolean
  onToggleMute: () => void
  isLiked: boolean
  likesCount: number
  onToggleLike: () => void
  onError: (reason: string) => void
}

const ReelCard: React.FC<ReelCardProps> = memo(({
  index,
  reel,
  isFirst,
  isActive,
  isApiReady,
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
  
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const isMutedRef = useRef(isMuted)

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    if (!isActive || !isApiReady || !videoId || !playerContainerRef.current) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {}
        playerRef.current = null
      }
      setIsIframeLoaded(false)
      return
    }

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        mute: isMutedRef.current ? 1 : 0,
        controls: 0,
        loop: 1,
        playlist: videoId,
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          setIsIframeLoaded(true)
          if (isMutedRef.current) {
            event.target.mute()
          } else {
            event.target.unMute()
          }
          event.target.playVideo()
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true)
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false)
          }
        },
        onError: (event: any) => {
          onError(`YouTube API Error Code: ${event.data}`)
        },
      },
    })

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {}
        playerRef.current = null
      }
    }
  }, [isActive, isApiReady, videoId])

  const handleTogglePlay = () => {
    if (!playerRef.current) return
    const nextPlaying = !isPlaying
    setIsPlaying(nextPlaying)

    if (nextPlaying) {
      playerRef.current.playVideo()
    } else {
      playerRef.current.pauseVideo()
    }
  }

  const handleToggleMuteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextMuted = !isMuted
    onToggleMute()

    if (playerRef.current) {
      if (nextMuted) {
        playerRef.current.mute()
      } else {
        playerRef.current.unMute()
      }
    }
  }

  const handleToggleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleLike()
  }

  useEffect(() => {
    if (isFirst && isActive) {
      const timer = setTimeout(() => setShowScrollHint(false), 5000)
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
      if (img.width === 120) setPreviewUrl(fallback)
      else setPreviewUrl(maxRes)
    }
    img.onerror = () => setPreviewUrl(fallback)
  }, [videoId])

  useEffect(() => {
    if (!videoId && isActive) {
      onError('Invalid or Missing Video ID')
    }
  }, [videoId, isActive, onError])

  if (!videoId) return null

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
          <div className="absolute inset-0 w-full h-full scale-[1.21] pointer-events-none z-5">
            <div ref={playerContainerRef} className="w-full h-full" />
          </div>
        )}

        {/* Прозрачное одеяло для Play/Pause */}
        <div onClick={handleTogglePlay} className="absolute inset-0 cursor-pointer z-10" />

        {/* Иконка паузы по центру */}
        {!isPlaying && (
          <div className="absolute z-20 pointer-events-none rounded-full bg-black/50 p-5 backdrop-blur-md transition-all animate-in fade-in zoom-in-75">
            <PlayIcon className="h-10 w-10 text-white fill-white translate-x-0.5" />
          </div>
        )}

        {/* Аватарка прижата К СТЕНКАМ (верх-лево), ник ПОД НЕЙ */}
        <div className="absolute top-0 left-0 z-20 flex flex-col items-start pointer-events-none">
          {reel.authorAvatar ? (
            <img
              src={reel.authorAvatar}
              alt={reel.authorName}
              className="h-14 w-14 rounded-br-2xl object-cover shadow-2xl border-r border-b border-white/20"
            />
          ) : (
            <div className="h-14 w-14 rounded-br-2xl bg-gray-900/90 backdrop-blur-md flex items-center justify-center text-white shadow-2xl border-r border-b border-white/20">
              <UserIcon className="h-6 w-6" />
            </div>
          )}
          <span className="mt-1.5 ml-2 font-medium text-white drop-shadow-lg text-[11px] tracking-wide bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
            @{reel.authorName}
          </span>
        </div>

        {/* Кнопка звука — ПРАВЫЙ ВЕРХНИЙ УГОЛ */}
        <button
          onClick={handleToggleMuteClick}
          className="absolute top-4 right-4 z-20 rounded-full bg-black/40 p-3 text-white backdrop-blur-md hover:bg-black/60 transition-colors active:scale-95 border border-white/10"
        >
          {isMuted ? <VolumeXIcon className="h-5 w-5" /> : <Volume2Icon className="h-5 w-5" />}
        </button>

        {/* Кнопка Лайка — ВНИЗУ СПРАВА */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-1">
          <button
            onClick={handleToggleLikeClick}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md active:scale-90 transition-transform hover:bg-black/60 border border-white/10"
          >
            <HeartIcon className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <span className="text-xs font-medium text-white drop-shadow-md">{likesCount}</span>
        </div>

        {isFirst && isActive && showScrollHint && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md animate-bounce pointer-events-none transition-opacity duration-500 border border-white/10">
            <span className="text-xs text-white/90 font-medium">Scroll down for next video</span>
            <ChevronDownIcon className="h-4 w-4 text-white/90" />
          </div>
        )}
      </div>
    </div>
  )
})