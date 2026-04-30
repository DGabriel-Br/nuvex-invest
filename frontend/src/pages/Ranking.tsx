import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingTable } from '../components/RankingTable';
import { useRanking } from '../hooks/useRanking';
import { api } from '../services/api';
import type { Perfil } from '../types';

export function Ranking() {
  const [perfil, setPerfil] = useState<Perfil>('dividendos');
  const navigate = useNavigate();

  // Carrega perfil salvo
  useEffect(() => {
    api.getPerfil().then((res) => {
      if (res?.perfil) setPerfil(res.perfil);
    }).catch(() => {});
  }, []);

  const { data, loading, error, search, setSearch, segment, setSegment, segments, refetch } =
    useRanking(perfil);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-mono text-gold-dk tracking-[0.3em] uppercase block mb-1">
            B3 — Ações Analisadas
          </span>
          <h1 className="font-display text-3xl sm:text-4xl italic text-ink">Ranking</h1>
        </div>

        {/* Seletor de perfil */}
        <div className="sm:ml-auto flex items-center gap-2 bg-surface border border-wire rounded-lg p-1">
          {(['dividendos', 'crescimento'] as Perfil[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPerfil(p)}
              className={`
                px-3 py-1.5 rounded text-[11px] font-mono tracking-wider uppercase transition-all
                ${perfil === p
                  ? 'bg-gold text-base font-semibold'
                  : 'text-ink2 hover:text-ink'}
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1 max-w-xs">
          <svg
            viewBox="0 0 16 16"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink3"
            fill="none"
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ticker ou nome…"
            className="field pl-8 w-full text-xs"
          />
        </div>

        {/* Segmento */}
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="field text-xs min-w-[160px]"
        >
          <option value="">Todos os segmentos</option>
          {segments.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Refresh */}
        <button
          type="button"
          onClick={refetch}
          className="btn-ghost flex items-center gap-1.5"
          title="Recarregar"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
            <path
              d="M2 8a6 6 0 1 0 1.5-4M2 4v4h4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Atualizar
        </button>
      </div>

      {/* Contador */}
      {!loading && !error && (
        <p className="text-ink3 font-mono text-[11px]">
          {data.length} ação{data.length !== 1 ? 'ões' : ''} — perfil{' '}
          <span className="text-gold">{perfil}</span>
        </p>
      )}

      {/* Estado de loading */}
      {loading && (
        <div className="panel flex items-center justify-center py-16 gap-3">
          <span className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <span className="text-ink2 font-mono text-sm">Calculando scores…</span>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="panel p-6 border-dn/30 bg-dn/5">
          <p className="text-dn font-mono text-sm">{error}</p>
          <button onClick={refetch} className="mt-3 btn-ghost text-xs">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Tabela */}
      {!loading && !error && (
        <RankingTable items={data} />
      )}

      {/* Link para comparar */}
      {!loading && data.length >= 2 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/comparar')}
            className="text-ink3 font-mono text-xs hover:text-gold transition-colors"
          >
            Comparar dois ativos →
          </button>
        </div>
      )}
    </div>
  );
}
