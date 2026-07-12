import { useState, useEffect } from 'react';

export type SimulationPhase = 'IDLE' | 'UPLOADING' | 'PARSING' | 'RETRIEVING' | 'RANKING' | 'REASONING' | 'READY';

export function useInvestigationSimulation(isAssessing: boolean) {
  const [phase, setPhase] = useState<SimulationPhase>('IDLE');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);

  useEffect(() => {
    if (isAssessing && phase === 'IDLE') {
      setPhase('UPLOADING');
      setStartTime(Date.now());
    }

    if (!isAssessing && phase !== 'IDLE' && phase !== 'READY') {
      // Fast forward to ready when assessment completes
      setPhase('READY');
      if (startTime) {
        setProcessingTime((Date.now() - startTime) / 1000);
      }
    }
  }, [isAssessing, phase, startTime]);

  useEffect(() => {
    if (!isAssessing) return;

    // We only simulate the intermediate steps if we're actively assessing
    let timeout: ReturnType<typeof setTimeout>;
    
    if (phase === 'UPLOADING') {
      timeout = setTimeout(() => setPhase('PARSING'), 800);
    } else if (phase === 'PARSING') {
      timeout = setTimeout(() => setPhase('RETRIEVING'), 1000);
    } else if (phase === 'RETRIEVING') {
      timeout = setTimeout(() => setPhase('RANKING'), 1200);
    } else if (phase === 'RANKING') {
      timeout = setTimeout(() => setPhase('REASONING'), 1500);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [phase, isAssessing]);

  // Reset if needed, but typically we just stay READY
  const reset = () => {
    setPhase('IDLE');
    setStartTime(null);
    setProcessingTime(0);
  };

  return {
    phase,
    reset,
    isComplete: phase === 'READY',
    processingTime
  };
}
