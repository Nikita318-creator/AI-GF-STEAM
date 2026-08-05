import React from 'react'

export function ReelsView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-dark/40 p-8 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-2">YouTube Reels / Shorts Feed</h2>
        <p className="text-sm text-white/50 mb-6">
          Player placeholder. Here we will embed the YouTube iframe/player.
        </p>
        <div className="aspect-[9/16] w-full rounded-xl bg-black/50 border border-white/5 flex items-center justify-center text-white/30">
          [ YouTube Player Container ]
        </div>
      </div>
    </div>
  )
}
