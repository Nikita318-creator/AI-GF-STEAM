import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BaseGameScreen } from './BaseGameScreen'

interface GameProps {
  onBack: () => void
}

const SLIDING_PUZZLE_RULES = `
• Slide the tiles into the empty space to reconstruct the hidden image.
• Rounds 1 to 4 use a 3x3 grid (8 tiles).
• Round 5+ increases difficulty to a 4x4 grid (15 tiles)!
• Numbers on tiles are shown for Levels 1–2 and hidden from Level 3 onwards.
• Hold down the Eye icon 👁️ at any time to peek at the target image!
• Progress is automatically saved so you can resume anytime.
`

export const SlidingPuzzleGame: React.FC<GameProps> = ({ onBack }) => {
  return (
    <BaseGameScreen
      gameId="sliding_puzzle"
      gameIndex={3}
      title="Sliding Puzzle"
      rulesText={SLIDING_PUZZLE_RULES}
      opponentName="AI Waifu"
      onBack={onBack}
    >
      {({ score, updateScore }) => (
        <PuzzleBoard scoreWins={score.wins} updateScore={updateScore} />
      )}
    </BaseGameScreen>
  )
}

interface PuzzleBoardProps {
  scoreWins: number
  updateScore: (result: 'win' | 'loss' | 'draw') => void
}

interface SavedPuzzleState {
  scoreWins: number
  gridSize: number
  tiles: number[]
  avatarIndex: number
  isSolved: boolean
}

const PUZZLE_SAVED_STATE_KEY = 'sliding_puzzle_saved_state'

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ scoreWins, updateScore }) => {
  const gridSize = scoreWins < 4 ? 3 : 4
  const totalTiles = gridSize * gridSize
  const showTileNumbers = scoreWins < 2 // Show numbers only on level 1 & 2

  const [avatarIndex, setAvatarIndex] = useState<number>((scoreWins % 26) + 1)
  const [tiles, setTiles] = useState<number[]>([])
  const [isSolved, setIsSolved] = useState<boolean>(false)
  const [isPeeking, setIsPeeking] = useState<boolean>(false)

  const isInitializedRef = useRef(false)
  const puzzleImageUrl = `/avatars/${avatarIndex}.jpg`

  const checkSolved = (currentTiles: number[]) => {
    for (let i = 0; i < currentTiles.length; i++) {
      if (currentTiles[i] !== i) return false
    }
    return true
  }

  // Generate a guaranteed solvable board
  const generateSolvableBoard = useCallback(() => {
    const solved = Array.from({ length: totalTiles }, (_, i) => i)
    let current = [...solved]
    let emptyIdx = totalTiles - 1

    const shuffleSteps = gridSize === 3 ? 40 : 80

    for (let i = 0; i < shuffleSteps; i++) {
      const validMoves: number[] = []
      const row = Math.floor(emptyIdx / gridSize)
      const col = emptyIdx % gridSize

      if (row > 0) validMoves.push(emptyIdx - gridSize) // UP
      if (row < gridSize - 1) validMoves.push(emptyIdx + gridSize) // DOWN
      if (col > 0) validMoves.push(emptyIdx - 1) // LEFT
      if (col < gridSize - 1) validMoves.push(emptyIdx + 1) // RIGHT

      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]
      ;[current[emptyIdx], current[randomMove]] = [current[randomMove], current[emptyIdx]]
      emptyIdx = randomMove
    }

    if (checkSolved(current)) {
      ;[current[0], current[1]] = [current[1], current[0]]
    }

    return current
  }, [gridSize, totalTiles])

  // Initialize or restore board state on mount / score changes
  useEffect(() => {
    const currentAvatarIdx = (scoreWins % 26) + 1
    const saved = localStorage.getItem(PUZZLE_SAVED_STATE_KEY)

    if (saved) {
      try {
        const parsed: SavedPuzzleState = JSON.parse(saved)
        // Restore if saved state matches current level and size
        if (
          parsed.scoreWins === scoreWins &&
          parsed.gridSize === gridSize &&
          parsed.tiles.length === totalTiles &&
          !parsed.isSolved
        ) {
          setTiles(parsed.tiles)
          setAvatarIndex(parsed.avatarIndex)
          setIsSolved(false)
          isInitializedRef.current = true
          return
        }
      } catch (e) {
        console.error('Failed to parse saved puzzle state', e)
      }
    }

    // Otherwise generate new board
    const newBoard = generateSolvableBoard()
    setTiles(newBoard)
    setAvatarIndex(currentAvatarIdx)
    setIsSolved(false)
    isInitializedRef.current = true
  }, [scoreWins, gridSize, totalTiles, generateSolvableBoard])

  // Save progress on tile change
  useEffect(() => {
    if (!isInitializedRef.current || tiles.length === 0) return

    if (isSolved) {
      localStorage.removeItem(PUZZLE_SAVED_STATE_KEY)
    } else {
      const stateToSave: SavedPuzzleState = {
        scoreWins,
        gridSize,
        tiles,
        avatarIndex,
        isSolved,
      }
      localStorage.setItem(PUZZLE_SAVED_STATE_KEY, JSON.stringify(stateToSave))
    }
  }, [tiles, isSolved, scoreWins, gridSize, avatarIndex])

  const handleManualRestart = () => {
    localStorage.removeItem(PUZZLE_SAVED_STATE_KEY)
    const newBoard = generateSolvableBoard()
    setTiles(newBoard)
    setIsSolved(false)
  }

  const handleTileClick = (index: number) => {
    if (isSolved || isPeeking) return

    const emptyIndex = tiles.indexOf(totalTiles - 1)
    const tileRow = Math.floor(index / gridSize)
    const tileCol = index % gridSize
    const emptyRow = Math.floor(emptyIndex / gridSize)
    const emptyCol = emptyIndex % gridSize

    const isAdjacent =
      (Math.abs(tileRow - emptyRow) === 1 && tileCol === emptyCol) ||
      (Math.abs(tileCol - emptyCol) === 1 && tileRow === emptyRow)

    if (!isAdjacent) return

    const newTiles = [...tiles]
    ;[newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]]
    setTiles(newTiles)

    if (checkSolved(newTiles)) {
      setIsSolved(true)
      localStorage.removeItem(PUZZLE_SAVED_STATE_KEY)
      updateScore('win')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full max-w-sm">
      {/* Level Info & Status Bar */}
      <div className="flex flex-col items-center justify-center gap-1 h-10">
        {isSolved ? (
          <span className="text-base font-bold text-emerald-400 animate-pulse">
            🎉 Puzzle Solved! Waifu Unlocked!
          </span>
        ) : (
          <span className="text-sm font-medium text-white/60">
            {showTileNumbers ? 'Slide tiles into order' : 'Match the picture! (Numbers hidden)'}
          </span>
        )}
      </div>

      {/* Main Puzzle Canvas with Peek Overlay */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 aspect-square rounded-2xl p-2.5 bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-xl shrink-0 overflow-hidden">
        {/* Full Image Preview Overlay (Triggered by Hold Peek) */}
        <div
          className={`absolute inset-0 p-2.5 z-20 transition-opacity duration-200 pointer-events-none ${
            isPeeking ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-full h-full rounded-xl overflow-hidden border-2 border-indigo-400 shadow-2xl relative">
            <img src={puzzleImageUrl} alt="Target Preview" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-indigo-300 backdrop-blur-sm border border-indigo-400/30">
              TARGET PATTERN
            </div>
          </div>
        </div>

        {/* Sliding Grid */}
        <div
          className="w-full h-full grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((tileValue, currentIndex) => {
            const isEmptyTile = tileValue === totalTiles - 1

            const originalRow = Math.floor(tileValue / gridSize)
            const originalCol = tileValue % gridSize
            const bgPositionX = (originalCol / (gridSize - 1)) * 100
            const bgPositionY = (originalRow / (gridSize - 1)) * 100

            if (isEmptyTile) {
              return (
                <div
                  key={currentIndex}
                  className="w-full h-full rounded-xl bg-slate-950/60 border border-white/5 shadow-inner"
                />
              )
            }

            return (
              <button
                key={currentIndex}
                onClick={() => handleTileClick(currentIndex)}
                disabled={isSolved || isPeeking}
                className="w-full h-full rounded-xl border border-white/20 shadow-md relative overflow-hidden transition-transform duration-100 active:scale-95 hover:border-indigo-400/80"
                style={{
                  backgroundImage: `url(${puzzleImageUrl})`,
                  backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                  backgroundPosition: `${bgPositionX}% ${bgPositionY}%`,
                }}
              >
                <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
                {showTileNumbers && (
                  <span className="absolute top-1 left-1.5 text-[10px] font-bold text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-black/50 px-1 rounded">
                    {tileValue + 1}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Controls: Peek Button & Shuffle/Next */}
      <div className="flex items-center gap-3 w-full">
        {/* Hold to Peek Image Button */}
        <button
          onMouseDown={() => setIsPeeking(true)}
          onMouseUp={() => setIsPeeking(false)}
          onMouseLeave={() => setIsPeeking(false)}
          onTouchStart={() => setIsPeeking(true)}
          onTouchEnd={() => setIsPeeking(false)}
          disabled={isSolved}
          className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600/40 border border-white/10 text-white font-bold text-sm transition-all flex items-center gap-2 shrink-0 select-none touch-none"
          title="Hold to view target image"
        >
          <span className="text-base">👁️</span>
          <span className="text-xs">Hold Peek</span>
        </button>

        {/* Primary Action Button */}
        <button
          onClick={isSolved ? handleManualRestart : handleManualRestart}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-98"
        >
          {isSolved ? 'Next Level' : 'Shuffle / Restart'}
        </button>
      </div>
    </div>
  )
}