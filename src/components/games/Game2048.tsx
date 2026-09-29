import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BaseGameScreen } from './BaseGameScreen'

interface GameProps {
  onBack: () => void
}

interface Tile {
  id: number
  value: number
  row: number
  col: number
  mergedInto?: number
  isNew?: boolean
  isMerged?: boolean
}

interface Saved2048State {
  tiles: Tile[]
  maxId: number
  gameOver: boolean
  gameWon: boolean
}

const STORAGE_KEY_2048 = 'game_2048_saved_state'

const GAME_RULES = `
• Slide tiles using Arrow keys, Mouse Drag (click & swipe), or Mobile Touch Swipes.
• When two tiles with the same number touch, they merge into one!
• Goal: Reach the 2048 tile to WIN the round and reveal the next waifu stage!
• If the board fills up with no valid moves left, you lose the round.
`

let tileIdCounter = 0

const getRandomTileValue = () => (Math.random() < 0.9 ? 2 : 4)

export const Game2048: React.FC<GameProps> = ({ onBack }) => {
  const [tiles, setTiles] = useState<Tile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_2048)
    if (saved) {
      try {
        const parsed: Saved2048State = JSON.parse(saved)
        if (parsed.tiles && Array.isArray(parsed.tiles) && parsed.tiles.length > 0) {
          tileIdCounter = parsed.maxId || parsed.tiles.reduce((max, t) => Math.max(max, t.id), 0)
          return parsed.tiles
        }
      } catch (e) {
        console.error('Failed to parse saved 2048 state', e)
      }
    }
    return []
  })

  const [gameOver, setGameOver] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_2048)
    if (saved) {
      try {
        const parsed: Saved2048State = JSON.parse(saved)
        return parsed.gameOver || false
      } catch (e) {}
    }
    return false
  })

  const [gameWon, setGameWon] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_2048)
    if (saved) {
      try {
        const parsed: Saved2048State = JSON.parse(saved)
        return parsed.gameWon || false
      } catch (e) {}
    }
    return false
  })

  const pointerStartPos = useRef<{ x: number; y: number } | null>(null)

  const getEmptyPositions = (currentTiles: Tile[]) => {
    const occupied = new Set(currentTiles.filter((t) => !t.mergedInto).map((t) => `${t.row}-${t.col}`))
    const empty: { row: number; col: number }[] = []
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!occupied.has(`${r}-${c}`)) empty.push({ row: r, col: c })
      }
    }
    return empty
  }

  const addRandomTileToTiles = (currentTiles: Tile[]): Tile[] => {
    const empty = getEmptyPositions(currentTiles)
    if (empty.length === 0) return currentTiles
    const pos = empty[Math.floor(Math.random() * empty.length)]
    const newTile: Tile = {
      id: ++tileIdCounter,
      value: getRandomTileValue(),
      row: pos.row,
      col: pos.col,
      isNew: true,
    }
    return [...currentTiles, newTile]
  }

  const initBoard = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_2048)
    tileIdCounter = 0
    let initialTiles: Tile[] = []
    initialTiles = addRandomTileToTiles(initialTiles)
    initialTiles = addRandomTileToTiles(initialTiles)
    setTiles(initialTiles)
    setGameOver(false)
    setGameWon(false)
  }, [])

  useEffect(() => {
    if (tiles.length === 0) {
      initBoard()
    }
  }, [initBoard, tiles.length])

  // Save current board state to localStorage whenever state changes
  useEffect(() => {
    if (tiles.length === 0) return

    if (gameOver || gameWon) {
      localStorage.removeItem(STORAGE_KEY_2048)
    } else {
      const activeTiles = tiles.filter((t) => !t.mergedInto)
      const maxId = activeTiles.reduce((max, t) => Math.max(max, t.id), tileIdCounter)

      const stateToSave: Saved2048State = {
        tiles: activeTiles,
        maxId,
        gameOver,
        gameWon,
      }
      localStorage.setItem(STORAGE_KEY_2048, JSON.stringify(stateToSave))
    }
  }, [tiles, gameOver, gameWon])

  const checkGameOver = (activeTiles: Tile[]): boolean => {
    if (activeTiles.length < 16) return false
    const grid: number[][] = Array(4)
      .fill(0)
      .map(() => Array(4).fill(0))

    activeTiles.forEach((t) => {
      grid[t.row][t.col] = t.value
    })

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3 && grid[r][c] === grid[r][c + 1]) return false
        if (r < 3 && grid[r][c] === grid[r + 1][c]) return false
      }
    }
    return true
  }

  const move = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', updateScore: (res: 'win' | 'loss' | 'draw') => void) => {
      if (gameOver || gameWon) return

      setTiles((prevTiles) => {
        const activeTiles = prevTiles
          .filter((t) => !t.mergedInto)
          .map((t) => ({ ...t, isNew: false, isMerged: false }))

        let moved = false
        const newTiles: Tile[] = []

        const processLine = (lineTiles: Tile[]) => {
          let targetIndex = 0
          for (let i = 0; i < lineTiles.length; i++) {
            const current = lineTiles[i]
            const next = lineTiles[i + 1]

            if (next && current.value === next.value) {
              const mergedValue = current.value * 2
              const mergedTileId = ++tileIdCounter

              const targetRow =
                direction === 'UP' || direction === 'DOWN'
                  ? direction === 'UP'
                    ? targetIndex
                    : 3 - targetIndex
                  : current.row
              const targetCol =
                direction === 'LEFT' || direction === 'RIGHT'
                  ? direction === 'LEFT'
                    ? targetIndex
                    : 3 - targetIndex
                  : current.col

              if (current.row !== targetRow || current.col !== targetCol) moved = true
              if (next.row !== targetRow || next.col !== targetCol) moved = true

              current.row = targetRow
              current.col = targetCol
              current.mergedInto = mergedTileId

              next.row = targetRow
              next.col = targetCol
              next.mergedInto = mergedTileId

              newTiles.push(current, next)
              newTiles.push({
                id: mergedTileId,
                value: mergedValue,
                row: targetRow,
                col: targetCol,
                isMerged: true,
              })

              i++
            } else {
              const targetRow =
                direction === 'UP' || direction === 'DOWN'
                  ? direction === 'UP'
                    ? targetIndex
                    : 3 - targetIndex
                  : current.row
              const targetCol =
                direction === 'LEFT' || direction === 'RIGHT'
                  ? direction === 'LEFT'
                    ? targetIndex
                    : 3 - targetIndex
                  : current.col

              if (current.row !== targetRow || current.col !== targetCol) moved = true

              current.row = targetRow
              current.col = targetCol
              newTiles.push(current)
            }
            targetIndex++
          }
        }

        for (let i = 0; i < 4; i++) {
          let lineTiles = activeTiles.filter((t) =>
            direction === 'UP' || direction === 'DOWN' ? t.col === i : t.row === i
          )

          lineTiles.sort((a, b) => {
            if (direction === 'UP') return a.row - b.row
            if (direction === 'DOWN') return b.row - a.row
            if (direction === 'LEFT') return a.col - b.col
            return b.col - a.col
          })

          processLine(lineTiles)
        }

        if (!moved) return prevTiles

        const updatedTiles = addRandomTileToTiles(newTiles)

        const has2048 = updatedTiles.some((t) => t.value === 2048 && !t.mergedInto)
        if (has2048 && !gameWon) {
          setGameWon(true)
          updateScore('win')
        }

        const remainingActive = updatedTiles.filter((t) => !t.mergedInto)
        if (checkGameOver(remainingActive)) {
          setGameOver(true)
          updateScore('loss')
        }

        return updatedTiles
      })
    },
    [gameOver, gameWon]
  )

  const handlePointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    pointerStartPos.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (
    e: React.PointerEvent,
    updateScore: (res: 'win' | 'loss' | 'draw') => void
  ) => {
    if (!pointerStartPos.current) return
    const dx = e.clientX - pointerStartPos.current.x
    const dy = e.clientY - pointerStartPos.current.y
    const swipeThreshold = 25

    if (Math.max(Math.abs(dx), Math.abs(dy)) > swipeThreshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 'RIGHT' : 'LEFT', updateScore)
      } else {
        move(dy > 0 ? 'DOWN' : 'UP', updateScore)
      }
    }
    pointerStartPos.current = null
  }

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-slate-800 text-slate-100 border-slate-700/60'
      case 4: return 'bg-slate-700 text-slate-100 border-slate-600/80'
      case 8: return 'bg-amber-600 text-white border-amber-500 shadow-amber-900/30'
      case 16: return 'bg-orange-600 text-white border-orange-500 shadow-orange-900/30'
      case 32: return 'bg-rose-600 text-white border-rose-500 shadow-rose-900/40'
      case 64: return 'bg-red-600 text-white border-red-500 shadow-red-900/40'
      case 128: return 'bg-yellow-500 text-slate-950 font-black border-yellow-300 ring-2 ring-yellow-400/50'
      case 256: return 'bg-yellow-400 text-slate-950 font-black border-yellow-200 ring-2 ring-yellow-300/50'
      case 512: return 'bg-emerald-500 text-white font-black border-emerald-300 ring-2 ring-emerald-400/50'
      case 1024: return 'bg-indigo-500 text-white font-black border-indigo-300 ring-2 ring-indigo-400/50'
      case 2048: return 'bg-purple-500 text-white font-black border-purple-300 ring-4 ring-purple-400/60 animate-pulse'
      default: return 'bg-purple-600 text-white font-black'
    }
  }

  return (
    <BaseGameScreen
      gameId="2048"
      gameIndex={2}
      title="2048"
      rulesText={GAME_RULES}
      opponentName="AI Waifu"
      onBack={onBack}
    >
      {({ updateScore }) => {
        useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              e.preventDefault()
            }
            if (e.key === 'ArrowUp') move('UP', updateScore)
            if (e.key === 'ArrowDown') move('DOWN', updateScore)
            if (e.key === 'ArrowLeft') move('LEFT', updateScore)
            if (e.key === 'ArrowRight') move('RIGHT', updateScore)
          }

          window.addEventListener('keydown', handleKeyDown)
          return () => window.removeEventListener('keydown', handleKeyDown)
        }, [move, updateScore])

        return (
          <div className="flex flex-col items-center justify-center gap-4 w-full max-w-sm select-none">
            {/* Status Indicator */}
            <div className="h-8 flex items-center justify-center">
              {gameWon && (
                <span className="text-base font-bold text-emerald-400 animate-bounce">
                  🎉 You Reached 2048! Waifu strip stage unlocked!
                </span>
              )}
              {gameOver && (
                <span className="text-base font-bold text-rose-400">
                  💔 Game Over! No moves left.
                </span>
              )}
              {!gameWon && !gameOver && (
                <span className="text-xs font-medium text-white/50">
                  Use Arrow Keys or Swipe to move tiles
                </span>
              )}
            </div>

            {/* Board Container */}
            <div
              onPointerDown={handlePointerDown}
              onPointerUp={(e) => handlePointerUp(e, updateScore)}
              className="w-72 h-72 sm:w-80 sm:h-80 bg-slate-900/90 p-2.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl relative cursor-grab active:cursor-grabbing touch-none select-none"
            >
              {/* Background Static Grid 4x4 */}
              <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2">
                {Array(16)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="w-full h-full rounded-xl bg-slate-950/50 border border-white/5"
                    />
                  ))}
              </div>

              {/* Dynamic Sliding Overlay Grid */}
              <div className="absolute inset-2.5 grid grid-cols-4 grid-rows-4 gap-2 pointer-events-none">
                {tiles.map((tile) => {
                  return (
                    <div
                      key={tile.id}
                      style={{
                        transform: `translate3d(calc(${tile.col} * 100% + ${tile.col} * 0.5rem), calc(${tile.row} * 100% + ${tile.row} * 0.5rem), 0)`,
                        transition: 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1)',
                      }}
                      className={`absolute top-0 left-0 w-[calc((100%-1.5rem)/4)] h-[calc((100%-1.5rem)/4)] transform-gpu ${
                        tile.mergedInto ? 'z-0 opacity-0' : tile.isMerged ? 'z-20' : 'z-10'
                      }`}
                    >
                      <div
                        className={`w-full h-full rounded-xl flex items-center justify-center text-lg sm:text-xl font-extrabold border shadow-lg ${getTileColor(
                          tile.value
                        )} ${
                          tile.isNew
                            ? 'scale-100 animate-in zoom-in-50 duration-150'
                            : tile.isMerged
                            ? 'scale-105 transition-transform duration-100'
                            : ''
                        }`}
                      >
                        {tile.value}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Restart Button */}
            <button
              onClick={initBoard}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-98"
            >
              {gameWon || gameOver ? 'Play Again' : 'Restart Board'}
            </button>
          </div>
        )
      }}
    </BaseGameScreen>
  )
}