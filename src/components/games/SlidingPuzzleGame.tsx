import React from 'react';
import { BaseGameScreen } from './BaseGameScreen';

interface GameProps {
  onBack: () => void;
}

export const SlidingPuzzleGame: React.FC<GameProps> = ({ onBack }) => {
  return (
    <BaseGameScreen title="Sliding Puzzle" onBack={onBack}>
      {/* 3x3 Sliding Puzzle logic will go here */}
    </BaseGameScreen>
  );
};