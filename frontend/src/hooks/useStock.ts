import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Acao } from '../types';

interface UseStockResult {
  acao: Acao | null;
  loading: boolean;
  error: string | null;
}

export function useStock(ticker: string): UseStockResult {
  const [acao, setAcao] = useState<Acao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setAcao(null);
    api
      .getAcao(ticker)
      .then(setAcao)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return { acao, loading, error };
}
