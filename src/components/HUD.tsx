import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCcw, LayoutGrid } from 'lucide-react';

interface HUDProps {
  score: number;
  onReset: () => void;
}

export const HUD: React.FC<HUDProps> = ({ score, onReset }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-8 font-sans">
      {/* Top Section */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-start">
          {/* Physics Config Panel */}
          <div className="glass-panel p-6 w-72 rounded-[24px] pointer-events-auto">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              Physics Engine
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] text-cyan-200 mb-2 uppercase tracking-wider font-semibold">
                  <span>Elasticity (Bounce)</span>
                  <span>0.85</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-lg relative overflow-hidden">
                   <div className="absolute top-0 left-0 h-full bg-cyan-400 w-[85%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-cyan-200 mb-2 uppercase tracking-wider font-semibold">
                  <span>Surface Friction</span>
                  <span>0.005</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-lg relative overflow-hidden">
                   <div className="absolute top-0 left-0 h-full bg-cyan-400 w-[15%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="glass-panel px-6 py-4 flex items-center gap-8 rounded-[24px] pointer-events-auto">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1">Session Score</p>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={score}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-mono text-white font-light"
                >
                  {score.toLocaleString()}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1">Target State</p>
              <p className="text-2xl font-mono text-cyan-400 font-light tracking-tighter">MOVABLE</p>
            </div>
          </div>
        </div>

        {/* Telemetry panel */}
        <div className="glass-panel p-4 rounded-[16px] pointer-events-auto text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Physics Env</span>
            <span className="font-mono text-sm text-white">READY</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Stability</span>
            <span className="font-mono text-sm text-white">OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* Arena Title Branding */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-1 items-start rotate-270 origin-left opacity-20 pointer-events-none">
        <h1 className="text-6xl font-black tracking-tighter text-white">TRICKSHOT.SANDBOX</h1>
        <p className="text-xs uppercase tracking-[0.5em] text-cyan-400">Experimental Physics v1.0.4</p>
      </div>

      {/* Visual Floor Decor */}
      <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-cyan-900/10 to-transparent border-t border-white/5 pointer-events-none" />

      {/* Controls Overlay */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 pointer-events-auto">
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <div className="w-10 h-10 glass-panel flex items-center justify-center text-white text-sm rounded-lg">W</div>
            <div className="w-10 h-10 glass-panel flex items-center justify-center text-white text-sm rounded-lg">A</div>
            <div className="w-10 h-10 glass-panel flex items-center justify-center text-white text-sm rounded-lg">S</div>
            <div className="w-10 h-10 glass-panel flex items-center justify-center text-white text-sm rounded-lg">D</div>
          </div>
          <span className="text-xs text-white/40 uppercase font-medium tracking-widest">Move Ball</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-8 h-10 glass-panel flex items-center justify-center text-white text-xs tracking-widest uppercase font-bold rounded-lg border border-white/20">Spacebar</div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-[10px] uppercase tracking-widest leading-none">AERIAL PULSE</span>
            <span className="text-[9px] text-white/40 uppercase font-medium tracking-wider mt-1">PEAK TIMING + DIRECTION = 3.5x APEX SURGE</span>
          </div>
        </div>


        
        <button 
          onClick={onReset}
          className="group px-6 h-10 glass-panel hover:bg-white/10 transition-colors flex items-center justify-center gap-3 text-white text-xs rounded-lg active:scale-95"
        >
          <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="font-bold uppercase tracking-widest">Reset Arena</span>
        </button>
      </div>

      {/* Grid Pattern Overlay Decor */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
    </div>
  );
};

