import React, { useState, useEffect } from 'react'
import { BaseGameScreen } from './BaseGameScreen'

interface GameProps {
  onBack: () => void
}

type BoardValue = 'X' | 'O' | null

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

const TIC_TAC_TOE_RULES = `
• The game is played on a 3x3 grid.
• You play as "X" and AI Waifu plays as "O".
• Take turns placing your mark in an empty square.
• The first player to get 3 marks in a row (horizontally, vertically, or diagonally) wins!
• If all 9 squares are full and no player has 3 in a row, it's a draw.
• Challenge Rule: The loser removes one item of choice!
`

export const TicTacToeGame: React.FC<GameProps> = ({ onBack }) => {
  const [board, setBoard] = useState<BoardValue[]>(Array(9).fill(null))
  const [startingPlayer, setStartingPlayer] = useState<'X' | 'O'>('X')
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X')
  const [winningCombo, setWinningCombo] = useState<number[] | null>(null)
  const [winner, setWinner] = useState<'X' | 'O' | 'DRAW' | null>(null)
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false)

  const checkWinner = (currentBoard: BoardValue[]) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return { winner: currentBoard[a], combo }
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'DRAW', combo: null }
    }
    return null
  }

  const handleCellClick = (index: number, updateScore: (res: 'win' | 'loss' | 'draw') => void) => {
    if (board[index] || winner || currentPlayer !== 'X' || isAiThinking) return

    const newBoard = [...board]
    newBoard[index] = 'X'
    setBoard(newBoard)

    const result = checkWinner(newBoard)
    if (result) {
      setWinner(result.winner as 'X' | 'O' | 'DRAW')
      setWinningCombo(result.combo)
      if (result.winner === 'X') updateScore('win')
      else if (result.winner === 'DRAW') updateScore('draw')
      return
    }

    setCurrentPlayer('O')
  }

  // Minimax Algorithm for Hard AI (Round 4+)
  const minimax = (
    tempBoard: BoardValue[],
    depth: number,
    isMaximizing: boolean
  ): { score: number; index?: number } => {
    const result = checkWinner(tempBoard)
    if (result?.winner === 'O') return { score: 10 - depth }
    if (result?.winner === 'X') return { score: depth - 10 }
    if (result?.winner === 'DRAW') return { score: 0 }

    const emptyIndices = tempBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null)

    if (isMaximizing) {
      let bestScore = -Infinity
      let bestMove = emptyIndices[0]
      for (const idx of emptyIndices) {
        tempBoard[idx] = 'O'
        const score = minimax(tempBoard, depth + 1, false).score
        tempBoard[idx] = null
        if (score > bestScore) {
          bestScore = score
          bestMove = idx
        }
      }
      return { score: bestScore, index: bestMove }
    } else {
      let bestScore = Infinity
      let bestMove = emptyIndices[0]
      for (const idx of emptyIndices) {
        tempBoard[idx] = 'X'
        const score = minimax(tempBoard, depth + 1, true).score
        tempBoard[idx] = null
        if (score < bestScore) {
          bestScore = score
          bestMove = idx
        }
      }
      return { score: bestScore, index: bestMove }
    }
  }

  const makeAiMove = (roundNumber: number) => {
    const emptyIndices = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null)

    if (emptyIndices.length === 0) return

    let targetIndex = -1

    // Rounds 1-3: Easy AI (70% random, 30% smart)
    if (roundNumber <= 3) {
      const isRandom = Math.random() < 0.7
      if (isRandom) {
        targetIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
      }
    }

    // Round 4+: Full Minimax Perfect AI
    if (targetIndex === -1) {
      const bestMove = minimax([...board], 0, true)
      targetIndex = bestMove.index ?? emptyIndices[0]
    }

    const newBoard = [...board]
    newBoard[targetIndex] = 'O'
    setBoard(newBoard)

    const result = checkWinner(newBoard)
    if (result) {
      setWinner(result.winner as 'X' | 'O' | 'DRAW')
      setWinningCombo(result.combo)

      const globalScoreUpdate = (window as any).__updateGameScore
      if (typeof globalScoreUpdate === 'function') {
        if (result.winner === 'O') globalScoreUpdate('loss')
        else if (result.winner === 'DRAW') globalScoreUpdate('draw')
      }
    } else {
      setCurrentPlayer('X')
    }
  }

  const resetRound = () => {
    const nextStart = startingPlayer === 'X' ? 'O' : 'X'
    setStartingPlayer(nextStart)
    setCurrentPlayer(nextStart)
    setBoard(Array(9).fill(null))
    setWinningCombo(null)
    setWinner(null)
  }

  return (
    <BaseGameScreen
      gameId="tictactoe"
      gameIndex={1}
      title="Tic-Tac-Toe"
      rulesText={TIC_TAC_TOE_RULES}
      opponentName="AI Waifu"
      onBack={onBack}
    >
      {({ score, updateScore }) => {
        ;(window as any).__updateGameScore = updateScore
        const roundNumber = score.wins + score.losses + score.draws + 1

        return (
          <div className="flex flex-col items-center justify-center gap-5 w-full max-w-sm">
            {/* Status & Difficulty Indicator */}
            <div className="flex flex-col items-center justify-center gap-1 h-10">
              {winner ? (
                <span className="text-base font-bold text-emerald-400 animate-pulse">
                  {winner === 'X' && '🎉 You Won!'}
                  {winner === 'O' && '💔 AI Waifu Won!'}
                  {winner === 'DRAW' && "🤝 It's a Draw!"}
                </span>
              ) : isAiThinking ? (
                <span className="text-sm font-medium text-rose-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  AI Waifu is thinking...
                </span>
              ) : (
                <span className="text-sm font-medium text-white/60">
                  {currentPlayer === 'X' ? 'Your Turn (X)' : 'AI Turn (O)'}
                </span>
              )}
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                Round {roundNumber} • {roundNumber <= 3 ? 'Easy Mode' : 'Hard Mode 🔥'}
              </span>
            </div>

            {/* AI Turn Handler with Round Difficulty */}
            <AiTurnEffect
              currentPlayer={currentPlayer}
              winner={winner}
              roundNumber={roundNumber}
              onMove={(r) => makeAiMove(r)}
              setIsAiThinking={setIsAiThinking}
            />

            {/* 3x3 Grid with Fixed Aspect Ratio */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 aspect-square grid grid-cols-3 grid-rows-3 gap-3 bg-slate-900/80 p-3 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl shrink-0">
              {board.map((cell, idx) => {
                const isWinningCell = winningCombo?.includes(idx)
                return (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx, updateScore)}
                    disabled={!!cell || !!winner || currentPlayer !== 'X' || isAiThinking}
                    className={`w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-extrabold rounded-xl transition-all duration-200 select-none ${
                      isWinningCell
                        ? 'bg-emerald-500/20 border-2 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-white/5'
                    }`}
                  >
                    {cell === 'X' && (
                      <span className="text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">
                        X
                      </span>
                    )}
                    {cell === 'O' && (
                      <span className="text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]">
                        O
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Reset / Next Round Button */}
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

// Helper component to run AI move timer effect
const AiTurnEffect: React.FC<{
  currentPlayer: 'X' | 'O'
  winner: string | null
  roundNumber: number
  onMove: (round: number) => void
  setIsAiThinking: (thinking: boolean) => void
}> = ({ currentPlayer, winner, roundNumber, onMove, setIsAiThinking }) => {
  useEffect(() => {
    if (currentPlayer === 'O' && !winner) {
      setIsAiThinking(true)
      const timer = setTimeout(() => {
        onMove(roundNumber)
        setIsAiThinking(false)
      }, 650)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, winner, roundNumber])

  return null
}