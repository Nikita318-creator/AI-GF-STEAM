import React, { useState, useEffect, useRef } from 'react'
import { Heart as HeartIcon, Volume2 as Volume2Icon, VolumeX as VolumeXIcon, AlertCircle as AlertCircleIcon } from 'lucide-react'
import { extractVideoId } from './feedVM'

export interface ReelItem {
  id: string
  url: string
  authorName: string
  authorAvatar?: string
  likesCount?: number
}

interface ReelsViewProps {
  reels: ReelItem[]
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

export const ReelsView: React.FC<ReelsViewProps> = ({ reels }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({})
  const [isMuted, setIsMuted] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)

  // Инициализация лайков
  useEffect(() => {
    const initialLikes: Record<string, number> = {}
    reels.forEach((r) => {
      initialLikes[r.id] = r.likesCount ?? Math.floor(Math.random() * 300) + 20
    })
    setLikesCountMap(initialLikes)
  }, [reels])

  // Загрузка YouTube Iframe API единовременно
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  // Переключение Reels при скролле
  const handleScroll = () => {
    if (!containerRef.current) return
    const height = containerRef.current.clientHeight
    if (height === 0) return
    const newIndex = Math.round(containerRef.current.scrollTop / height)
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
      setActiveIndex(newIndex)
    }
  }

  const toggleLike = (id: string) => {
    setLikedMap((prev) => {
      const current = !!prev[id]
      const next = !current
      setLikesCountMap((countPrev) => ({
        ...countPrev,
        [id]: (countPrev[id] || 0) + (next ? 1 : -1),
      }))
      return { ...prev, [id]: next }
    })
  }

  if (!reels || reels.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-400">
        <p>Нет доступных видео в ленте</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-snap snap-y snap-mandatory overflow-y-auto bg-black"
    >
      {reels.map((reel, index) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          isActive={index === activeIndex}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          isLiked={!!likedMap[reel.id]}
          likesCount={likesCountMap[reel.id] ?? 0}
          onToggleLike={() => toggleLike(reel.id)}
        />
      ))}
    </div>
  )
}

interface ReelCardProps {
  reel: ReelItem
  isActive: boolean
  isMuted: boolean
  onToggleMute: () => void
  isLiked: boolean
  likesCount: number
  onToggleLike: () => void
}

const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  isLiked,
  likesCount,
  onToggleLike,
}) => {
  const videoId = extractVideoId(reel.url)
  const playerRef = useRef<any>(null)
  const containerId = useRef(`yt-player-${reel.id}`).current
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!videoId) {
      setHasError(true)
      return
    }

    let playerInstance: any = null

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return

      playerInstance = new window.YT.Player(containerId, {
        videoId: videoId,
        playerVars: {
          autoplay: isActive ? 1 : 0,
          controls: 0,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          mute: isMuted ? 1 : 0,
        },
        events: {
          onReady: (event: any) => {
            playerRef.current = event.target
            if (isMuted) event.target.mute()
            else event.target.unMute()
            if (isActive) event.target.playVideo()
          },
          onError: (err: any) => {
            console.error('[YT Player Error]', err)
            setHasError(true)
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      const checkYT = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkYT)
          initPlayer()
        }
      }, 100)
      return () => clearInterval(checkYT)
    }

    return () => {
      if (playerInstance && typeof playerInstance.destroy === 'function') {
        playerInstance.destroy()
      }
      playerRef.current = null
    }
  }, [videoId, containerId])

  useEffect(() => {
    if (!playerRef.current) return
    try {
      if (isActive) playerRef.current.playVideo()
      else playerRef.current.pauseVideo()
    } catch (e) {}
  }, [isActive])

  useEffect(() => {
    if (!playerRef.current) return
    try {
      if (isMuted) playerRef.current.mute()
      else playerRef.current.unMute()
    } catch (e) {}
  }, [isMuted])

  return (
    <div className="relative h-full w-full snap-start snap-always overflow-hidden bg-black flex items-center justify-center">
      {videoId && !hasError ? (
        <div className="relative h-full w-full pointer-events-none overflow-hidden">
          <div
            id={containerId}
            className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
            style={{ width: '100vh', height: '177.77vh' }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
          <AlertCircleIcon className="h-10 w-10 text-red-400" />
          <p className="text-sm">Не удалось загрузить видео</p>
        </div>
      )}

      <div onClick={onToggleMute} className="absolute inset-0 cursor-pointer z-10" />

      <button
        onClick={onToggleMute}
        className="absolute top-6 right-6 z-20 rounded-full bg-black/40 p-3 text-white backdrop-blur-md hover:bg-black/60"
      >
        {isMuted ? <VolumeXIcon className="h-6 w-6" /> : <Volume2Icon className="h-6 w-6" />}
      </button>

      <div className="absolute bottom-6 left-4 right-16 z-20 flex items-center gap-3">
        {reel.authorAvatar && (
          <img
            src={reel.authorAvatar}
            alt={reel.authorName}
            className="h-10 w-10 rounded-full border-2 border-white/20 object-cover"
          />
        )}
        <span className="font-semibold text-white drop-shadow">{reel.authorName}</span>
      </div>

      <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-1">
        <button
          onClick={onToggleLike}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md active:scale-90"
        >
          <HeartIcon className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
        <span className="text-xs font-medium text-white drop-shadow">{likesCount}</span>
      </div>
    </div>
  )
}