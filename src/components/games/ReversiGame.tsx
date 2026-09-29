import React, { useState, useEffect } from 'react'
import { BaseGameScreen } from './BaseGameScreen'

interface GameProps {
  onBack: () => void
}

type BoardState = ('BLACK' | 'WHITE' | null)[]

const BOARD_SIZE = 8
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
]

// Weight matrix for board positional evaluation
const CELL_WEIGHTS = [
  100, -20,  10,   5,   5,  10, -20, 100,
  -20, -50,  -2,  -2,  -2,  -2, -50, -20,
   10,  -2,   1,   1,   1,   1,  -2,  10,
    5,  -2,   1,   0,   0,   1,  -2,   5,
    5,  -2,   1,   0,   0,   1,  -2,   5,
   10,  -2,   1,   1,   1,   1,  -2,  10,
  -20, -50,  -2,  -2,  -2,  -2, -50, -20,
  100, -20,  10,   5,   5,  10, -20, 100,
]

const REVERSI_RULES = `
• Reversi (Othello) is played on an 8x8 grid.
• You play as Dark Discs (Black) and AI Waifu plays as Light Discs (White).
• Outflank your opponent's discs to flip them to your color.
• A valid move must trap one or more opponent discs between your placed disc and another disc of your color along any straight line (horizontal, vertical, or diagonal).
• If a player has no valid moves, their turn is skipped.
• The game ends when neither player can move or the board is full. The player with the most discs wins!
`

const LOCAL_STORAGE_KEY = 'reversi_board_state'

export const ReversiGame: React.FC<GameProps> = ({ onBack }) => {
  const getInitialBoard = (): BoardState => {
    const b: BoardState = Array(64).fill(null)
    b[27] = 'WHITE'
    b[28] = 'BLACK'
    b[35] = 'BLACK'
    b[36] = 'WHITE'
    return b
  }

  const [board, setBoard] = useState<BoardState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.board && Array.isArray(parsed.board)) return parsed.board
      } catch (e) {
        console.error('Failed to restore Reversi state', e)
      }
    }
    return getInitialBoard()
  })

  const [currentPlayer, setCurrentPlayer] = useState<'BLACK' | 'WHITE'>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.currentPlayer) return parsed.currentPlayer
      } catch (e) {}
    }
    return 'BLACK'
  })

  const [winner, setWinner] = useState<'BLACK' | 'WHITE' | 'DRAW' | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.winner || null
      } catch (e) {}
    }
    return null
  })

  const [isAiThinking, setIsAiThinking] = useState(false)

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ board, currentPlayer, winner })
    )
  }, [board, currentPlayer, winner])

  const getFlipsForMove = (
    currentBoard: BoardState,
    index: number,
    player: 'BLACK' | 'WHITE'
  ): number[] => {
    if (currentBoard[index] !== null) return []

    const opponent = player === 'BLACK' ? 'WHITE' : 'BLACK'
    const row = Math.floor(index / BOARD_SIZE)
    const col = index % BOARD_SIZE
    const flipsToMake: number[] = []

    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr
      let c = col + dc
      const currentFlips: number[] = []

      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const idx = r * BOARD_SIZE + c
        if (currentBoard[idx] === opponent) {
          currentFlips.push(idx)
        } else if (currentBoard[idx] === player) {
          if (currentFlips.length > 0) {
            flipsToMake.push(...currentFlips)
          }
          break
        } else {
          break
        }
        r += dr
        c += dc
      }
    }

    return flipsToMake
  }

  const getValidMoves = (currentBoard: BoardState, player: 'BLACK' | 'WHITE') => {
    const validMoves: { index: number; flips: number[] }[] = []
    for (let i = 0; i < 64; i++) {
      const flips = getFlipsForMove(currentBoard, i, player)
      if (flips.length > 0) {
        validMoves.push({ index: i, flips })
      }
    }
    return validMoves
  }

  const countDiscs = (currentBoard: BoardState) => {
    let black = 0
    let white = 0
    currentBoard.forEach((cell) => {
      if (cell === 'BLACK') black++
      if (cell === 'WHITE') white++
    })
    return { black, white }
  }

  // --- MINIMAX WITH ALPHA-BETA PRUNING ---
  const evaluateBoard = (currentBoard: BoardState): number => {
    let score = 0
    currentBoard.forEach((cell, idx) => {
      if (cell === 'WHITE') score += CELL_WEIGHTS[idx]
      else if (cell === 'BLACK') score -= CELL_WEIGHTS[idx]
    })
    return score
  }

  const minimaxAlphaBeta = (
    tempBoard: BoardState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): { score: number; bestMoveIndex?: number } => {
    const whiteMoves = getValidMoves(tempBoard, 'WHITE')
    const blackMoves = getValidMoves(tempBoard, 'BLACK')

    if (depth === 0 || (whiteMoves.length === 0 && blackMoves.length === 0)) {
      return { score: evaluateBoard(tempBoard) }
    }

    if (isMaximizing) {
      if (whiteMoves.length === 0) {
        return minimaxAlphaBeta(tempBoard, depth - 1, alpha, beta, false)
      }
      let maxScore = -Infinity
      let bestMoveIndex = whiteMoves[0].index

      for (const move of whiteMoves) {
        const nextBoard = [...tempBoard]
        nextBoard[move.index] = 'WHITE'
        move.flips.forEach((f) => (nextBoard[f] = 'WHITE'))

        const result = minimaxAlphaBeta(nextBoard, depth - 1, alpha, beta, false)
        if (result.score > maxScore) {
          maxScore = result.score
          bestMoveIndex = move.index
        }
        alpha = Math.max(alpha, maxScore)
        if (beta <= alpha) break
      }
      return { score: maxScore, bestMoveIndex }
    } else {
      if (blackMoves.length === 0) {
        return minimaxAlphaBeta(tempBoard, depth - 1, alpha, beta, true)
      }
      let minScore = Infinity
      let bestMoveIndex = blackMoves[0].index

      for (const move of blackMoves) {
        const nextBoard = [...tempBoard]
        nextBoard[move.index] = 'BLACK'
        move.flips.forEach((f) => (nextBoard[f] = 'BLACK'))

        const result = minimaxAlphaBeta(nextBoard, depth - 1, alpha, beta, true)
        if (result.score < minScore) {
          minScore = result.score
          bestMoveIndex = move.index
        }
        beta = Math.min(beta, minScore)
        if (beta <= alpha) break
      }
      return { score: minScore, bestMoveIndex }
    }
  }

  const handleCellClick = (index: number, updateScore: (res: 'win' | 'loss' | 'draw') => void) => {
    if (currentPlayer !== 'BLACK' || winner || isAiThinking) return

    const flips = getFlipsForMove(board, index, 'BLACK')
    if (flips.length === 0) return

    const newBoard = [...board]
    newBoard[index] = 'BLACK'
    flips.forEach((idx) => {
      newBoard[idx] = 'BLACK'
    })

    setBoard(newBoard)

    const aiMoves = getValidMoves(newBoard, 'WHITE')
    const playerMoves = getValidMoves(newBoard, 'BLACK')

    if (aiMoves.length > 0) {
      setCurrentPlayer('WHITE')
    } else if (playerMoves.length === 0) {
      finishGame(newBoard, updateScore)
    }
  }

  const makeAiMove = (roundNumber: number) => {
    const validMoves = getValidMoves(board, 'WHITE')

    if (validMoves.length === 0) {
      const playerMoves = getValidMoves(board, 'BLACK')
      if (playerMoves.length === 0) {
        const globalScoreUpdate = (window as any).__updateGameScore
        if (typeof globalScoreUpdate === 'function') {
          finishGame(board, globalScoreUpdate)
        }
      } else {
        setCurrentPlayer('BLACK')
      }
      return
    }

    let targetIndex = validMoves[0].index

    // Dynamic AI Depth scaling (Capped at Depth 4 for Round 7+)
    if (roundNumber <= 2) {
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]
      targetIndex = randomMove.index
    } else {
      let depth = 2
      if (roundNumber >= 5 && roundNumber <= 6) depth = 3
      if (roundNumber >= 7) depth = 4

      const best = minimaxAlphaBeta([...board], depth, -Infinity, Infinity, true)
      if (best.bestMoveIndex !== undefined) {
        targetIndex = best.bestMoveIndex
      }
    }

    const flips = getFlipsForMove(board, targetIndex, 'WHITE')
    const newBoard = [...board]
    newBoard[targetIndex] = 'WHITE'
    flips.forEach((idx) => {
      newBoard[idx] = 'WHITE'
    })

    setBoard(newBoard)

    const playerNextMoves = getValidMoves(newBoard, 'BLACK')
    const aiNextMoves = getValidMoves(newBoard, 'WHITE')

    if (playerNextMoves.length > 0) {
      setCurrentPlayer('BLACK')
    } else if (aiNextMoves.length > 0) {
      setCurrentPlayer('WHITE')
    } else {
      const globalScoreUpdate = (window as any).__updateGameScore
      if (typeof globalScoreUpdate === 'function') {
        finishGame(newBoard, globalScoreUpdate)
      }
    }
  }

  const finishGame = (
    finalBoard: BoardState,
    updateScore: (res: 'win' | 'loss' | 'draw') => void
  ) => {
    const { black, white } = countDiscs(finalBoard)
    if (black > white) {
      setWinner('BLACK')
      updateScore('win')
    } else if (white > black) {
      setWinner('WHITE')
      updateScore('loss')
    } else {
      setWinner('DRAW')
      updateScore('draw')
    }
  }

  const resetRound = () => {
    const initBoard = getInitialBoard()
    setBoard(initBoard)
    setCurrentPlayer('BLACK')
    setWinner(null)
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  const validPlayerMoves = getValidMoves(board, 'BLACK')
  const validIndices = new Set(validPlayerMoves.map((m) => m.index))
  const { black: blackCount, white: whiteCount } = countDiscs(board)

  return (
    <BaseGameScreen
      gameId="reversi"
      gameIndex={2}
      title="Reversi"
      rulesText={REVERSI_RULES}
      opponentName="AI Waifu"
      onBack={onBack}
    >
      {({ score, updateScore }) => {
        ;(window as any).__updateGameScore = updateScore
        const roundNumber = score.wins + score.losses + score.draws + 1

        const getDifficultyLabel = () => {
          if (roundNumber <= 2) return 'Easy (Random)'
          if (roundNumber <= 4) return 'Medium (2 Steps Ahead)'
          if (roundNumber <= 6) return 'Hard (3 Steps Ahead) 🔥'
          return 'Max Level (4 Steps Ahead) 😈'
        }

        return (
          <div className="flex flex-col items-center justify-center gap-4 w-full max-w-md">
            <style>{`
              .disc-container {
                perspective: 600px;
              }
              .disc-inner {
                position: relative;
                width: 80%;
                height: 80%;
                transition: transform 0.5s ease-in-out;
                transform-style: preserve-3d;
              }
              .disc-inner.is-white {
                transform: rotateY(180deg);
              }
              .disc-face {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 9999px;
                backface-visibility: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
              }
              .disc-black {
                background: linear-gradient(135deg, #334155 0%, #0f172a 100%);
                border: 1px solid #475569;
              }
              .disc-white {
                background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
                border: 1px solid #94a3b8;
                transform: rotateY(180deg);
              }
            `}</style>

            {/* Score Stats & Dynamic Difficulty Badge */}
            <div className="flex items-center justify-between w-full px-4 py-2 rounded-xl bg-slate-900/90 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-500 shadow-sm" />
                <span className="text-xs font-bold text-white">You: {blackCount}</span>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">
                  Round {roundNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">AI: {whiteCount}</span>
                <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-sm" />
              </div>
            </div>

            {/* Turn Banner */}
            <div className="h-6 flex items-center justify-center">
              {winner ? (
                <span className="text-sm font-bold text-emerald-400 animate-pulse">
                  {winner === 'BLACK' && '🎉 You Won!'}
                  {winner === 'WHITE' && '💔 AI Waifu Won!'}
                  {winner === 'DRAW' && "🤝 It's a Draw!"}
                </span>
              ) : isAiThinking ? (
                <span className="text-xs font-medium text-rose-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  AI Waifu is calculating moves...
                </span>
              ) : (
                <span className="text-xs font-medium text-white/60">
                  {currentPlayer === 'BLACK' ? 'Your Turn (Dark)' : "AI's Turn (Light)"}
                </span>
              )}
            </div>

            <ReversiAiTurnEffect
              currentPlayer={currentPlayer}
              winner={winner}
              roundNumber={roundNumber}
              onMove={(r) => makeAiMove(r)}
              setIsAiThinking={setIsAiThinking}
            />

            {/* 8x8 Board Grid */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 aspect-square grid grid-cols-8 grid-rows-8 gap-1 bg-emerald-900 p-2 rounded-2xl border-2 border-emerald-700/80 shadow-2xl shrink-0">
              {board.map((cell, idx) => {
                const isValid =
                  validIndices.has(idx) && currentPlayer === 'BLACK' && !winner && !isAiThinking

                return (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx, updateScore)}
                    disabled={!isValid}
                    className="w-full h-full bg-emerald-800 hover:bg-emerald-750 rounded-sm flex items-center justify-center relative transition-colors disc-container overflow-hidden"
                  >
                    {cell !== null && (
                      <div
                        className={`disc-inner ${
                          cell === 'WHITE' ? 'is-white' : ''
                        }`}
                      >
                        <div className="disc-face disc-black" />
                        <div className="disc-face disc-white" />
                      </div>
                    )}

                    {isValid && cell === null && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60 border border-emerald-300 animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Controls */}
            <button
              onClick={resetRound}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-98"
            >
              {winner ? 'Next Round' : 'Restart Board'}
            </button>
          </div>
        )
      }}
    </BaseGameScreen>
  )
}

const ReversiAiTurnEffect: React.FC<{
  currentPlayer: 'BLACK' | 'WHITE'
  winner: string | null
  roundNumber: number
  onMove: (round: number) => void
  setIsAiThinking: (thinking: boolean) => void
}> = ({ currentPlayer, winner, roundNumber, onMove, setIsAiThinking }) => {
  useEffect(() => {
    if (currentPlayer === 'WHITE' && !winner) {
      setIsAiThinking(true)
      const timer = setTimeout(() => {
        onMove(roundNumber)
        setIsAiThinking(false)
      }, 750)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, winner, roundNumber])

  return null
}