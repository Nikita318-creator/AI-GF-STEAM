import React, { useState, useEffect } from 'react'

export interface GameScore {
  wins: number
  losses: number
  draws: number
}

interface BaseGameScreenProps {
  gameId: string
  gameIndex: number
  title: string
  rulesText: string
  opponentName?: string
  onBack: () => void
  children?: (props: {
    score: GameScore
    updateScore: (result: 'win' | 'loss' | 'draw') => void
    resetScore: () => void
    currentPhotoUrl: string
  }) => React.ReactNode
}

export const BaseGameScreen: React.FC<BaseGameScreenProps> = ({
  gameId,
  gameIndex,
  title,
  rulesText,
  opponentName = 'AI Waifu',
  onBack,
  children,
}) => {
  const scoreStorageKey = `game_score_${gameId}`
  const [showRules, setShowRules] = useState(false)

  const [score, setScore] = useState<GameScore>(() => {
    const saved = localStorage.getItem(scoreStorageKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse score from localStorage', e)
      }
    }
    return { wins: 0, losses: 0, draws: 0 }
  })

  useEffect(() => {
    localStorage.setItem(scoreStorageKey, JSON.stringify(score))
  }, [score, scoreStorageKey])

  const photoIndex = Math.min(Math.max(score.wins + 1, 1), 11)
  const currentPhotoUrl = `/photos/waifuGame${gameIndex}_${photoIndex}.jpg`

  const updateScore = (result: 'win' | 'loss' | 'draw') => {
    setScore((prev) => {
      if (result === 'win') return { ...prev, wins: prev.wins + 1 }
      if (result === 'loss') return { ...prev, losses: prev.losses + 1 }
      return { ...prev, draws: prev.draws + 1 }
    })
  }

  const resetScore = () => {
    setScore({ wins: 0, losses: 0, draws: 0 })
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white select-none relative overflow-hidden">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/10 backdrop-blur-md z-10">
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-medium flex items-center gap-1.5 active:scale-95"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-lg font-bold tracking-wide text-white">{title}</h1>

        <div className="flex items-center gap-3">
          {/* Rules Popup Trigger Button */}
          <button
            onClick={() => setShowRules(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/50 flex items-center gap-1.5 text-xs font-bold text-indigo-300 transition-all active:scale-95 shadow-md"
          >
            <span>ℹ️</span> Rules
          </button>

          <button
            onClick={resetScore}
            className="text-xs text-white/40 hover:text-white/80 transition-colors"
            title="Reset stats"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Persistent Scoreboard Panel */}
      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-white/5 flex items-center justify-between shadow-inner z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-xs text-indigo-300 shadow-md">
            YOU
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Player</p>
            <p className="text-xs text-emerald-400 font-bold">{score.wins} Wins</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-1 rounded-xl bg-black/40 border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Score</span>
          <span className="text-sm font-extrabold text-white">
            {score.wins} : {score.losses}
          </span>
          {score.draws > 0 && (
            <span className="text-[9px] text-white/40">{score.draws} draws</span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">{opponentName}</p>
            <p className="text-xs text-rose-400 font-bold">{score.losses} Wins</p>
          </div>
          <img
            src={currentPhotoUrl}
            alt={opponentName}
            className="w-9 h-9 rounded-full object-cover border border-rose-500/50 shadow-md"
          />
        </div>
      </div>

      {/* Game + Waifu Split Layout */}
      <main className="flex-1 flex flex-row items-center justify-center p-4 gap-6 overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-md">
          {children && children({ score, updateScore, resetScore, currentPhotoUrl })}
        </div>

        <div className="hidden lg:flex flex-col w-72 h-full max-h-[520px] rounded-2xl bg-slate-900/80 border border-white/10 p-3 shadow-2xl backdrop-blur-xl justify-between shrink-0">
          <div className="relative w-full h-3/4 rounded-xl overflow-hidden border border-white/10 bg-slate-800">
            <img
              src={currentPhotoUrl}
              alt={opponentName}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-rose-300">
              Stage {photoIndex}/10
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <p className="text-xs font-semibold text-rose-200 leading-relaxed">
              "Ready for the challenge? The loser of the round takes off one item of clothing!"
            </p>
          </div>
        </div>
      </main>

      {/* Rules Modal Window */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📖</span> {title} Rules
              </h2>
              <button
                onClick={() => setShowRules(false)}
                className="text-white/40 hover:text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {rulesText}
            </p>
            <button
              onClick={() => setShowRules(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-98"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}