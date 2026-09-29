import React from 'react';
import { BaseGameScreen } from './BaseGameScreen';

interface GameProps {
  onBack: () => void;
}

export const Game2048: React.FC<GameProps> = ({ onBack }) => {
  return (
    <BaseGameScreen title="2048" onBack={onBack}>
      {/* 2048 logic will go here */}
    </BaseGameScreen>
  );
};