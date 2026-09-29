import React, { useState, useEffect } from 'react'
import { BaseGameScreen } from './BaseGameScreen'

interface GameProps {
  onBack: () => void
}

interface CardItem {
  id: string
  avatarId: number
  isFlipped: boolean
  isMatched: boolean
  isPlaceholder?: boolean
}

const MEMORY_GAME_RULES = `
• Flip cards to find matching pairs of avatars.
• Match all pairs on the board to win the round!
• Grid size expands as you progress:
  - Level 1: 3x3 Grid
  - Level 2: 3x4 Grid
  - Level 3: 4x4 Grid
  - Level 4: 5x4 Grid
  - Level 5+: 6x4 Grid
• Challenge Rule: Defeat the AI Waifu by completing the memory grid to strip her down!
`

export const MemoryCardsGame: React.FC<GameProps> = ({ onBack }) => {
  const [cards, setCards] = useState<CardItem[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [isLocked, setIsLocked] = useState<boolean>(false)
  const [isGameCompleted, setIsGameCompleted] = useState<boolean>(false)

  const getGridConfig = (winsCount: number) => {
    const level = winsCount + 1
    if (level === 1) return { rows: 3, cols: 3, totalCells: 9 }
    if (level === 2) return { rows: 3, cols: 4, totalCells: 12 }
    if (level === 3) return { rows: 4, cols: 4, totalCells: 16 }
    if (level === 4) return { rows: 5, cols: 4, totalCells: 20 }
    return { rows: 6, cols: 4, totalCells: 24 }
  }

  const initBoard = (winsCount: number) => {
    const { totalCells } = getGridConfig(winsCount)
    const isOdd = totalCells % 2 !== 0
    const pairsCount = Math.floor(totalCells / 2)

    const availableAvatarIds = Array.from({ length: 20 }, (_, i) => i + 1)
    const shuffledAvatars = [...availableAvatarIds].sort(() => Math.random() - 0.5)
    const selectedAvatars = shuffledAvatars.slice(0, pairsCount)

    let deck: CardItem[] = []
    selectedAvatars.forEach((avatarId, idx) => {
      deck.push({
        id: `card-${idx}-a`,
        avatarId,
        isFlipped: false,
        isMatched: false,
      })
      deck.push({
        id: `card-${idx}-b`,
        avatarId,
        isFlipped: false,
        isMatched: false,
      })
    })

    if (isOdd) {
      deck.push({
        id: 'placeholder',
        avatarId: 0,
        isFlipped: true,
        isMatched: true,
        isPlaceholder: true,
      })
    }

    deck = deck.sort(() => Math.random() - 0.5)

    setCards(deck)
    setFlippedIndices([])
    setIsLocked(false)
    setIsGameCompleted(false)
  }

  const handleCardClick = (
    index: number,
    updateScore: (res: 'win' | 'loss' | 'draw') => void
  ) => {
    if (
      isLocked ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      cards[index].isPlaceholder
    ) {
      return
    }

    const newCards = [...cards]
    newCards[index].isFlipped = true
    const updatedFlipped = [...flippedIndices, index]
    setCards(newCards)

    if (updatedFlipped.length === 2) {
      setIsLocked(true)
      const [firstIdx, secondIdx] = updatedFlipped

      if (newCards[firstIdx].avatarId === newCards[secondIdx].avatarId) {
        newCards[firstIdx].isMatched = true
        newCards[secondIdx].isMatched = true
        setCards([...newCards])
        setFlippedIndices([])
        setIsLocked(false)

        const allMatched = newCards.every((card) => card.isMatched)
        if (allMatched) {
          setIsGameCompleted(true)
          updateScore('win')
        }
      } else {
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false
          newCards[secondIdx].isFlipped = false
          setCards([...newCards])
          setFlippedIndices([])
          setIsLocked(false)
        }, 850)
      }
    } else {
      setFlippedIndices(updatedFlipped)
    }
  }

  return (
    <BaseGameScreen
      gameId="memory_cards"
      gameIndex={2}
      title="Memory Cards"
      rulesText={MEMORY_GAME_RULES}
      opponentName="AI Waifu"
      onBack={onBack}
    >
      {({ score, updateScore }) => {
        const currentLevel = score.wins + 1
        const gridConfig = getGridConfig(score.wins)

        useEffect(() => {
          initBoard(score.wins)
        }, [score.wins])

        return (
          <div className="flex flex-col items-center justify-center gap-4 w-full h-full max-w-md my-auto">
            <div className="flex items-center justify-between w-full px-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Level {currentLevel} ({gridConfig.rows}x{gridConfig.cols})
              </span>
              {isGameCompleted && (
                <span className="text-xs font-bold text-emerald-400 animate-pulse">
                  🎉 Level Complete!
                </span>
              )}
            </div>

            <div
              className="grid gap-2 w-full p-3 bg-slate-900/80 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl max-h-[60vh] overflow-y-auto"
              style={{
                gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
              }}
            >
              {cards.map((card, idx) => {
                if (card.isPlaceholder) {
                  return (
                    <div
                      key={card.id}
                      className="aspect-square rounded-xl bg-slate-800/30 border border-dashed border-white/10 flex items-center justify-center text-xs text-white/20"
                    >
                      ★
                    </div>
                  )
                }

                const isOpen = card.isFlipped || card.isMatched

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx, updateScore)}
                    disabled={isOpen || isLocked}
                    className={`aspect-square w-full rounded-xl transition-all duration-300 relative select-none overflow-hidden ${
                      isOpen
                        ? 'bg-slate-800 border-2 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'bg-gradient-to-br from-indigo-900/80 to-slate-800 hover:from-indigo-800 border border-white/10 active:scale-95'
                    }`}
                  >
                    {isOpen ? (
                      <img
                        src={`/avatars/${card.avatarId}.jpg`}
                        alt={`Avatar ${card.avatarId}`}
                        className="w-full h-full object-cover rounded-lg animate-fade-in"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-sm">
                        ❓
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => initBoard(score.wins)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-98"
            >
              Restart Current Level
            </button>
          </div>
        )
      }}
    </BaseGameScreen>
  )
}