import React, { useState, useEffect } from 'react'
import { BaseGameScreen } from './BaseGameScreen'

interface GameProps {
  onBack: () => void
}

type PieceType = 'player' | 'player-king' | 'ai' | 'ai-king' | null
type BoardState = PieceType[]

interface Position {
  row: number
  col: number
}

interface Move {
  from: number
  to: number
  captured?: number
}

interface SavedCheckersState {
  board: BoardState
  currentPlayer: 'player' | 'ai'
  winner: 'player' | 'ai' | 'DRAW' | null
}

const CHECKERS_STORAGE_KEY = 'checkers_saved_game_state'

const CHECKERS_RULES = `
• Board & Pieces: Played on an 8x8 grid. You play as Red pieces (bottom), AI Waifu plays as Dark/Purple pieces (top).
• Movement: Regular pieces move diagonally forward by 1 cell into empty dark squares.
• Capturing: Jump over an adjacent opponent piece diagonally into an empty space to capture it.
• Mandatory Capture: If a capture move is available, you MUST capture!
• Kings: Reaching the opposite end transforms your piece into a King (👑), allowing backward diagonal movement & jumps!
• Winning: Eliminate all opponent pieces or leave them with no valid legal moves.
• Challenge Rule: The loser of the round takes off one item of clothing!
`

export const CheckersGame: React.FC<GameProps> = ({ onBack }) => {
  // Restore saved state or initialize a fresh board
  const [board, setBoard] = useState<BoardState>(() => {
    const saved = localStorage.getItem(CHECKERS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed: SavedCheckersState = JSON.parse(saved)
        if (parsed.board && parsed.board.length === 64) {
          return parsed.board
        }
      } catch (e) {
        console.error('Failed to parse saved checkers state', e)
      }
    }
    return initBoard()
  })

  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>(() => {
    const saved = localStorage.getItem(CHECKERS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed: SavedCheckersState = JSON.parse(saved)
        if (parsed.currentPlayer) return parsed.currentPlayer
      } catch (e) {}
    }
    return 'player'
  })

  const [winner, setWinner] = useState<'player' | 'ai' | 'DRAW' | null>(() => {
    const saved = localStorage.getItem(CHECKERS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed: SavedCheckersState = JSON.parse(saved)
        return parsed.winner || null
      } catch (e) {}
    }
    return null
  })

  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [validMoves, setValidMoves] = useState<Move[]>([])
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false)
  const [forcedCaptureWarning, setForcedCaptureWarning] = useState<boolean>(false)

  // Save current board state to localStorage whenever state changes
  useEffect(() => {
    if (winner) {
      localStorage.removeItem(CHECKERS_STORAGE_KEY)
    } else {
      const stateToSave: SavedCheckersState = {
        board,
        currentPlayer,
        winner,
      }
      localStorage.setItem(CHECKERS_STORAGE_KEY, JSON.stringify(stateToSave))
    }
  }, [board, currentPlayer, winner])

  function initBoard(): BoardState {
    const b: BoardState = Array(64).fill(null)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          const index = row * 8 + col
          if (row < 3) b[index] = 'ai'
          else if (row > 4) b[index] = 'player'
        }
      }
    }
    return b
  }

  const getPos = (index: number): Position => ({
    row: Math.floor(index / 8),
    col: index % 8,
  })

  const getIndex = (row: number, col: number): number => row * 8 + col

  const getMovesForPiece = (
    currentBoard: BoardState,
    fromIdx: number
  ): Move[] => {
    const piece = currentBoard[fromIdx]
    if (!piece) return []

    const moves: Move[] = []
    const jumps: Move[] = []
    const { row, col } = getPos(fromIdx)

    const isPlayer = piece.startsWith('player')
    const isKing = piece.endsWith('king')

    let directions: [number, number][] = []
    if (isKing) {
      directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    } else if (isPlayer) {
      directions = [[-1, -1], [-1, 1]]
    } else {
      directions = [[1, -1], [1, 1]]
    }

    directions.forEach(([dRow, dCol]) => {
      const targetRow = row + dRow
      const targetCol = col + dCol

      if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
        const targetIdx = getIndex(targetRow, targetCol)
        if (!currentBoard[targetIdx]) {
          moves.push({ from: fromIdx, to: targetIdx })
        }
      }

      const jumpRow = row + dRow * 2
      const jumpCol = col + dCol * 2
      const midRow = row + dRow
      const midCol = col + dCol

      if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8) {
        const midIdx = getIndex(midRow, midCol)
        const jumpIdx = getIndex(jumpRow, jumpCol)
        const midPiece = currentBoard[midIdx]

        const isOpponent =
          midPiece &&
          (isPlayer ? midPiece.startsWith('ai') : midPiece.startsWith('player'))

        if (isOpponent && !currentBoard[jumpIdx]) {
          jumps.push({ from: fromIdx, to: jumpIdx, captured: midIdx })
        }
      }
    })

    if (jumps.length > 0) return jumps
    return moves
  }

  const getAllMoves = (currentBoard: BoardState, player: 'player' | 'ai'): Move[] => {
    let allJumps: Move[] = []
    let allRegularMoves: Move[] = []

    currentBoard.forEach((piece, idx) => {
      if (
        piece &&
        ((player === 'player' && piece.startsWith('player')) ||
          (player === 'ai' && piece.startsWith('ai')))
      ) {
        const moves = getMovesForPiece(currentBoard, idx)
        moves.forEach((m) => {
          if (m.captured !== undefined) allJumps.push(m)
          else allRegularMoves.push(m)
        })
      }
    })

    return allJumps.length > 0 ? allJumps : allRegularMoves
  }

  const evaluateBoard = (currentBoard: BoardState): number => {
    let score = 0
    currentBoard.forEach((piece) => {
      if (!piece) return
      if (piece === 'ai') score += 10
      else if (piece === 'ai-king') score += 30
      else if (piece === 'player') score -= 10
      else if (piece === 'player-king') score -= 30
    })
    return score
  }

  const simulateMove = (tempBoard: BoardState, move: Move): BoardState => {
    const newBoard = [...tempBoard]
    const piece = newBoard[move.from]!
    const { row: toRow } = getPos(move.to)

    newBoard[move.from] = null
    newBoard[move.to] = piece

    if (move.captured !== undefined) {
      newBoard[move.captured] = null
    }

    if (piece === 'ai' && toRow === 7) newBoard[move.to] = 'ai-king'
    if (piece === 'player' && toRow === 0) newBoard[move.to] = 'player-king'

    return newBoard
  }

  const minimaxCheckers = (
    tempBoard: BoardState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): { score: number; move?: Move } => {
    const aiMoves = getAllMoves(tempBoard, 'ai')
    const playerMoves = getAllMoves(tempBoard, 'player')

    if (depth === 0 || aiMoves.length === 0 || playerMoves.length === 0) {
      return { score: evaluateBoard(tempBoard) }
    }

    if (isMaximizing) {
      let maxScore = -Infinity
      let bestMove = aiMoves[0]

      for (const move of aiMoves) {
        const nextBoard = simulateMove(tempBoard, move)
        const evaluation = minimaxCheckers(
          nextBoard,
          depth - 1,
          alpha,
          beta,
          false
        ).score

        if (evaluation > maxScore) {
          maxScore = evaluation
          bestMove = move
        }
        alpha = Math.max(alpha, evaluation)
        if (beta <= alpha) break
      }
      return { score: maxScore, move: bestMove }
    } else {
      let minScore = Infinity
      let bestMove = playerMoves[0]

      for (const move of playerMoves) {
        const nextBoard = simulateMove(tempBoard, move)
        const evaluation = minimaxCheckers(
          nextBoard,
          depth - 1,
          alpha,
          beta,
          true
        ).score

        if (evaluation < minScore) {
          minScore = evaluation
          bestMove = move
        }
        beta = Math.min(beta, evaluation)
        if (beta <= alpha) break
      }
      return { score: minScore, move: bestMove }
    }
  }

  const triggerForcedCaptureWarning = () => {
    setForcedCaptureWarning(true)
    setTimeout(() => setForcedCaptureWarning(false), 1200)
  }

  const handleCellClick = (
    index: number,
    updateScore: (res: 'win' | 'loss' | 'draw') => void
  ) => {
    if (winner || currentPlayer !== 'player' || isAiThinking) return

    const piece = board[index]
    const allPlayerMoves = getAllMoves(board, 'player')
    const hasMandatoryCaptures = allPlayerMoves.some((m) => m.captured !== undefined)

    if (piece && piece.startsWith('player')) {
      const pieceMoves = allPlayerMoves.filter((m) => m.from === index)

      if (hasMandatoryCaptures && pieceMoves.length === 0) {
        triggerForcedCaptureWarning()
        return
      }

      setSelectedCell(index)
      setValidMoves(pieceMoves)
      return
    }

    if (selectedCell !== null) {
      const moveToExecute = validMoves.find((m) => m.to === index)
      if (moveToExecute) {
        executeMove(moveToExecute, updateScore)
      } else if (hasMandatoryCaptures) {
        triggerForcedCaptureWarning()
      }
    }
  }

  const executeMove = (
    move: Move,
    updateScore: (res: 'win' | 'loss' | 'draw') => void
  ) => {
    const newBoard = [...board]
    const piece = newBoard[move.from]!
    const { row: toRow } = getPos(move.to)

    newBoard[move.from] = null
    newBoard[move.to] = piece

    if (move.captured !== undefined) {
      newBoard[move.captured] = null
    }

    if (piece === 'player' && toRow === 0) newBoard[move.to] = 'player-king'
    else if (piece === 'ai' && toRow === 7) newBoard[move.to] = 'ai-king'

    setBoard(newBoard)
    setSelectedCell(null)
    setValidMoves([])

    const nextPlayer = currentPlayer === 'player' ? 'ai' : 'player'
    const opponentMoves = getAllMoves(newBoard, nextPlayer)

    if (opponentMoves.length === 0) {
      const winnerSide = currentPlayer
      setWinner(winnerSide)
      localStorage.removeItem(CHECKERS_STORAGE_KEY)
      if (winnerSide === 'player') updateScore('win')
      else updateScore('loss')
      return
    }

    setCurrentPlayer(nextPlayer)
  }

  const makeAiMove = (roundNumber: number) => {
    const aiMoves = getAllMoves(board, 'ai')
    if (aiMoves.length === 0) {
      setWinner('player')
      localStorage.removeItem(CHECKERS_STORAGE_KEY)
      const globalScoreUpdate = (window as any).__updateGameScore
      if (typeof globalScoreUpdate === 'function') globalScoreUpdate('win')
      return
    }

    let maxDepth = 1
    if (roundNumber >= 3 && roundNumber <= 4) maxDepth = 2
    if (roundNumber >= 5) maxDepth = 4

    const result = minimaxCheckers(board, maxDepth, -Infinity, Infinity, true)
    const selectedMove = result.move || aiMoves[0]

    executeMove(selectedMove, (res) => {
      const globalScoreUpdate = (window as any).__updateGameScore
      if (typeof globalScoreUpdate === 'function') globalScoreUpdate(res)
    })
  }

  const resetRound = () => {
    localStorage.removeItem(CHECKERS_STORAGE_KEY)
    setBoard(initBoard())
    setSelectedCell(null)
    setValidMoves([])
    setCurrentPlayer('player')
    setWinner(null)
    setForcedCaptureWarning(false)
  }

  const allPlayerMoves = getAllMoves(board, 'player')
  const mandatoryCaptureIndices = new Set(
    allPlayerMoves
      .filter((m) => m.captured !== undefined)
      .map((m) => m.from)
  )

  return (
    <BaseGameScreen
      gameId="checkers"
      gameIndex={2}
      title="Checkers"
      rulesText={CHECKERS_RULES}
      opponentName="AI Waifu"
      onBack={onBack}
    >
      {({ score, updateScore }) => {
        ;(window as any).__updateGameScore = updateScore
        const roundNumber = score.wins + score.losses + score.draws + 1

        return (
          <div className="flex flex-col items-center justify-center gap-4 w-full max-w-sm">
            {/* Status Header */}
            <div className="flex flex-col items-center justify-center gap-1 h-10">
              {winner ? (
                <span className="text-base font-bold text-emerald-400 animate-pulse">
                  {winner === 'player' && '🎉 You Won!'}
                  {winner === 'ai' && '💔 AI Waifu Won!'}
                </span>
              ) : isAiThinking ? (
                <span className="text-sm font-medium text-rose-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  AI Waifu is planning a move...
                </span>
              ) : forcedCaptureWarning ? (
                <span className="text-xs font-bold text-red-400 animate-bounce">
                  ⚠️ Mandatory Capture! You MUST jump!
                </span>
              ) : (
                <span className="text-sm font-medium text-white/60">
                  {currentPlayer === 'player' ? 'Your Turn (Red)' : 'AI Turn (Dark)'}
                </span>
              )}
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                Round {roundNumber} • {roundNumber <= 2 ? 'Easy' : roundNumber <= 4 ? 'Medium' : 'Hard 🔥'}
              </span>
            </div>

            {/* AI Turn Controller */}
            <CheckersAiTurnEffect
              currentPlayer={currentPlayer}
              winner={winner}
              roundNumber={roundNumber}
              onMove={(r) => makeAiMove(r)}
              setIsAiThinking={setIsAiThinking}
            />

            {/* 8x8 Board */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 aspect-square grid grid-cols-8 grid-rows-8 bg-slate-900 rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden p-1 gap-0.5 shrink-0">
              {board.map((cell, idx) => {
                const { row, col } = getPos(idx)
                const isDarkSquare = (row + col) % 2 === 1
                const isSelected = selectedCell === idx
                const isValidTarget = validMoves.some((m) => m.to === idx)
                const isMandatoryPiece = mandatoryCaptureIndices.has(idx)

                return (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx, updateScore)}
                    disabled={!isDarkSquare || !!winner || currentPlayer !== 'player' || isAiThinking}
                    className={`w-full h-full flex items-center justify-center relative transition-all duration-150 ${
                      isDarkSquare ? 'bg-slate-800' : 'bg-slate-950/40'
                    } ${isSelected ? 'ring-2 ring-amber-400 z-10' : ''}`}
                  >
                    {isValidTarget && (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-400/80 animate-pulse z-20 shadow-lg shadow-emerald-400/50" />
                    )}

                    {cell && (
                      <div
                        className={`w-3/4 h-3/4 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                          cell.startsWith('player')
                            ? 'bg-gradient-to-br from-rose-500 to-red-700 border border-rose-300 shadow-rose-900/50'
                            : 'bg-gradient-to-br from-indigo-600 to-slate-900 border border-indigo-400 shadow-indigo-950/80'
                        } ${isSelected ? 'scale-110' : ''} ${
                          forcedCaptureWarning && isMandatoryPiece
                            ? 'animate-bounce ring-4 ring-red-500 shadow-red-500 shadow-2xl z-30'
                            : ''
                        }`}
                      >
                        {cell.endsWith('king') && (
                          <span className="text-[10px] sm:text-xs">👑</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Restart Button */}
            <button
              onClick={resetRound}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-98"
            >
              {winner ? 'Next Round' : 'Restart Round'}
            </button>
          </div>
        )
      }}
    </BaseGameScreen>
  )
}

const CheckersAiTurnEffect: React.FC<{
  currentPlayer: 'player' | 'ai'
  winner: string | null
  roundNumber: number
  onMove: (round: number) => void
  setIsAiThinking: (thinking: boolean) => void
}> = ({ currentPlayer, winner, roundNumber, onMove, setIsAiThinking }) => {
  useEffect(() => {
    if (currentPlayer === 'ai' && !winner) {
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