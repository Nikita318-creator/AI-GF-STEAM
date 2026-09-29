import React from 'react';
import { BaseGameScreen } from './BaseGameScreen';

interface GameProps {
  onBack: () => void;
}

export const CheckersGame: React.FC<GameProps> = ({ onBack }) => {
  return (
    <BaseGameScreen title="Checkers" onBack={onBack}>
      {/* Checkers logic will go here */}
    </BaseGameScreen>
  );
};