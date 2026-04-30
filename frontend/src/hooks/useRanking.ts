import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Perfil, RankingItem } from '../types';

interface UseRankingResult {
  data: RankingItem[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (v: string) => void;
  segment: string;
  setSegment: (v: string) => void;
  segments: string[];
  refetch: () => void;
}

export function useRanking(perfil: Perfil): UseRankingResult {
  const [raw, setRaw] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getRanking(perfil)
      .then(setRaw)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [perfil, tick]);

  const segments = useMemo(
    () =>
      [...new Set(raw.map((i) => i.acao.segment).filter((s): s is string => s !== null))].sort(),
    [raw],
  );

  const data = useMemo(() => {
    const q = search.trim().toUpperCase();
    return raw.filter((item) => {
      const matchSearch =
        !q ||
        item.acao.ticker.includes(q) ||
        item.acao.name.toUpperCase().includes(q);
      const matchSegment = !segment || item.acao.segment === segment;
      return matchSearch && matchSegment;
    });
  }, [raw, search, segment]);

  return {
    data,
    loading,
    error,
    search,
    setSearch,
    segment,
    setSegment,
    segments,
    refetch: () => setTick((n) => n + 1),
  };
}
