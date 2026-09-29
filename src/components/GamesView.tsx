import React, { useState } from 'react'
import {
  TicTacToeGame,
  CheckersGame,
  ReversiGame,
  Game2048,
  SlidingPuzzleGame,
  MemoryCardsGame,
} from './games'

export interface GameItem {
  id: string
  title: string
  coverUrl: string
}

const MOCK_GAMES: GameItem[] = [
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    coverUrl: '/photos/game1.jpg',
  },
  {
    id: 'checkers',
    title: 'Checkers',
    coverUrl: '/photos/game2.jpg',
  },
  {
    id: 'reversi',
    title: 'Reversi',
    coverUrl: '/photos/game3.jpg',
  },
  {
    id: '2048',
    title: '2048',
    coverUrl: '/photos/game4.jpg',
  },
  {
    id: 'sliding-puzzle',
    title: 'Sliding Puzzle',
    coverUrl: '/photos/game5.jpg',
  },
  {
    id: 'memory-cards',
    title: 'Memory Cards',
    coverUrl: '/photos/game6.jpg',
  },
]

export function GamesView() {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  const handleBack = () => setSelectedGameId(null)

  // Роутинг между экранами игр
  if (selectedGameId === 'tic-tac-toe') {
    return <TicTacToeGame onBack={handleBack} />
  }
  if (selectedGameId === 'checkers') {
    return <CheckersGame onBack={handleBack} />
  }
  if (selectedGameId === 'reversi') {
    return <ReversiGame onBack={handleBack} />
  }
  if (selectedGameId === '2048') {
    return <Game2048 onBack={handleBack} />
  }
  if (selectedGameId === 'sliding-puzzle') {
    return <SlidingPuzzleGame onBack={handleBack} />
  }
  if (selectedGameId === 'memory-cards') {
    return <MemoryCardsGame onBack={handleBack} />
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-black/40">
      <h1 className="text-2xl font-bold mb-6 text-white">Games Library</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {MOCK_GAMES.map((game) => (
          <div
            key={game.id}
            onClick={() => setSelectedGameId(game.id)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-dark/50 p-2 transition-all cursor-pointer hover:scale-105 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
          >
            <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-800">
              <img
                src={game.coverUrl}
                alt={game.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="mt-2 p-1">
              <h3 className="text-sm font-semibold text-white truncate">
                {game.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}