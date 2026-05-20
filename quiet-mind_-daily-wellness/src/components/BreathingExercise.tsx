import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Circle } from 'lucide-react';

const PHASE_SEQUENCE = ['inhale', 'hold', 'exhale', 'pause'] as const;
type Phase = typeof PHASE_SEQUENCE[number];

export const BreathingExercise: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('inhale');
  const [timer, setTimer] = useState(4);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let phaseIndex = 0;
    let remaining = 4;

    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        phaseIndex = (phaseIndex + 1) % PHASE_SEQUENCE.length;
        remaining = 4;
        setPhase(PHASE_SEQUENCE[phaseIndex]);
        setTimer(4);
      } else {
        setTimer(remaining);
      }
      timeoutId = setTimeout(tick, 1000);
    };

    timeoutId = setTimeout(tick, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'pause': return 'Wait';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return '#5A5A40';
      case 'hold': return '#8E9299';
      case 'exhale': return '#5A5A40';
      case 'pause': return '#8E9299';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="relative flex items-center justify-center w-80 h-80">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-2 border-[#5A5A40]/10 rounded-full" />
        
        {/* Pulsing Breathing Circle */}
        <motion.div
          animate={{
            scale: phase === 'inhale' ? 1.5 : phase === 'hold' ? 1.5 : 1,
            opacity: phase === 'inhale' ? 0.6 : phase === 'exhale' ? 0.6 : 0.3,
          }}
          transition={{
            duration: 4,
            ease: "easeInOut"
          }}
          className="w-40 h-40 rounded-full"
          style={{ backgroundColor: getPhaseColor() }}
        />

        {/* Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.h3
              key={phase}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-3xl font-serif font-bold text-[#5A5A40]"
            >
              {getPhaseText()}
            </motion.h3>
          </AnimatePresence>
          <span className="text-xl font-mono mt-2 text-[#5A5A40]/60">{timer}s</span>
        </div>
      </div>

      <div className="mt-16 max-w-sm">
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#5A5A40] mb-4">The Box Breathing Technique</h4>
        <p className="text-[#5A5A40]/60 leading-relaxed">
          Focus on the movement of your lungs. This slow, rhythmic cycle helps calm the nervous system and clear mental fog.
        </p>
      </div>
    </div>
  );
};
