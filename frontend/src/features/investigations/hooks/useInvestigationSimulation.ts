import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';

export type SimulationPhase = 'INITIALIZING' | 'SEARCHING' | 'REASONING' | 'DRAFTING' | 'READY';

export function useInvestigationSimulation(investigationId: string, equipmentId: string | null = null, delayMs = 2000) {
  const [phase, setPhase] = useState<SimulationPhase>('INITIALIZING');
  const [confidence, setConfidence] = useState(89);
  const [confidenceReason, setConfidenceReason] = useState<string | null>(null);
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch Organization Memory Context
    let isMounted = true;
    
    const fetchContext = async () => {
      try {
        const queryParams = equipmentId ? `?equipment_id=${equipmentId}` : '';
        const response = await apiClient.get(`/investigations/${investigationId}/context${queryParams}`);
        if (isMounted) {
          setContext(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch investigation context:", err);
      }
    };
    
    fetchContext();

    return () => { isMounted = false; };
  }, [investigationId, equipmentId]);

  useEffect(() => {
    if (!context) return; // Wait for context before running simulation

    let t1: NodeJS.Timeout, t2: NodeJS.Timeout, t3: NodeJS.Timeout, t4: NodeJS.Timeout;

    // Phase 1: Searching
    t1 = setTimeout(() => {
      setPhase('SEARCHING');
    }, 1000);

    // Phase 2: Reasoning
    t2 = setTimeout(() => {
      setPhase('REASONING');
      setConfidence(context.confidence?.score || 93);
      setConfidenceReason(`Checking ${context.calibration?.calibration_id || "Calibration"} and ${context.regulations?.[0] || "Regulation"}`);
    }, 1000 + delayMs);

    // Phase 3: Drafting
    t3 = setTimeout(() => {
      setPhase('DRAFTING');
      setConfidence((context.confidence?.score || 93) + 6);
      setConfidenceReason(`Matched Historical Case #${context.historical_match?.investigation_id || "INV-0000"}`);
    }, 1000 + delayMs * 2);

    // Phase 4: Ready
    t4 = setTimeout(() => {
      setPhase('READY');
    }, 1000 + delayMs * 3);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [delayMs, context]);

  return {
    phase,
    confidence,
    confidenceReason,
    context,
    isComplete: phase === 'READY'
  };
}
