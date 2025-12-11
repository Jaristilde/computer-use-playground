import { useState } from 'react';
import type { StepState } from '../types';

export interface StepPayload {
  prompt?: string;
  previousResponseId?: string;
  callId?: string;
  screenshotBase64?: string;
  currentUrl?: string;
  acknowledgedSafetyChecks?: any[];
}

const initialState: StepState = {
  log: [],
};

export function useComputerUse() {
  const [state, setState] = useState<StepState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = async (payload: StepPayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/computer-use-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Computer-use step failed');
      }

      const data = await response.json();
      const computerCall = data.output?.find((item: any) => item.type === 'computer_call');

      setState((prev) => ({
        responseId: data.id,
        computerCall,
        log: [...prev.log, data],
      }));

      return computerCall;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setState(initialState);
    setError(null);
  };

  return { state, loading, error, step, reset };
}
