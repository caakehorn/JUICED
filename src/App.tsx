import { useState } from 'react';
import { PhysicsGame } from './components/PhysicsGame';
import { HUD } from './components/HUD';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  const [score, setScore] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const handleScore = () => {
    setScore(prev => prev + 1);
  };

  const handleReset = () => {
    setResetKey(prev => prev + 1);
    setScore(0);
  };

  return (
    <main className="w-full h-full relative bg-[#0c0a15] flex items-center justify-center overflow-hidden">
      <div className="mesh-bg" />
      
      <div className="w-full h-full relative overflow-hidden">
        <PhysicsGame key={resetKey} onScore={handleScore} />
        <HUD score={score} onReset={handleReset} />
      </div>
    </main>
  );

}

