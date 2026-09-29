import React from 'react';
import { BaseGameScreen } from './BaseGameScreen';

interface GameProps {
  onBack: () => void;
}

export const ReversiGame: React.FC<GameProps> = ({ onBack }) => {
  return (
    <BaseGameScreen title="Reversi" onBack={onBack}>
      {/* Reversi logic will go here */}
    </BaseGameScreen>
  );
};