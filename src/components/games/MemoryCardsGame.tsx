import React from 'react';
import { BaseGameScreen } from './BaseGameScreen';

interface GameProps {
  onBack: () => void;
}

export const MemoryCardsGame: React.FC<GameProps> = ({ onBack }) => {
  return (
    <BaseGameScreen title="Memory Cards" onBack={onBack}>
      {/* Memory Match logic will go here */}
    </BaseGameScreen>
  );
};