import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from 'recharts';
import { StockCard } from '../components/StockCard';
import { api } from '../services/api';
import type { Acao, Perfil, RankingItem } from '../types';
import { fmt, varColor } from '../utils/format';

interface TickerInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allTickers: string[];
}

function TickerInput({ label, value, onChange, allTickers }: TickerInputProps) {
  const listId = `tickers-${label}`;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-mono text-ink3 uppercase tracking-widest">{label}</span>
      <div className="relative">
        <input
          list={listId}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="Ex: WEGE3"
          className="field font-mono uppercase w-full tracking-wider text-gold placeholder:text-ink3 placeholder:normal-case"
        />
        <datalist id={listId}>
          {allTickers.map((t) => <option key={t} value={t} />)}
        </datalist>
      </div>
    </div>
  );
}

interface CompareRowProps {
  label: string;
  valA: string;
  valB: string;
  winnerA?: boolean;
  winnerB?: boolean;
  varA?: number | null;
  varB?: number | null;
}

function CompareRow({ label, valA, valB, winnerA, winnerB, varA, varB }: CompareRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 border-b border-wire last:border-0">
      <span className={`font-mono text-sm text-right ${winnerA ? 'text-up font-semibold' : varA !== undefined ? varColor(varA) : 'text-ink'} ${valA === '-' ? '!text-ink3' : ''}`}>
        {valA}
      </span>
      <span className="text-[9px] font-mono text-ink3 uppercase tracking-widest text-center w-20 shrink-0">
        {label}
      </span>
      <span className={`font-mono text-sm text-left ${winnerB ? 'text-up font-semibold' : varB !== undefined ? varColor(varB) : 'text-ink'} ${valB === '-' ? '!text-ink3' : ''}`}>
        {valB}
      </span>
    </div>
  );
}

function better(a: number | null, b: number | null, higherIsBetter = true): [boolean, boolean] {
  if (a == null && b == null) return [false, false];
  if (a == null) return [false, true];
  if (b == null) return [true, false];
  if (a === b) return [false, false];
  return higherIsBetter ? [a > b, b > a] : [a < b, b < a];
}

export function Compare() {
  const [params, setParams] = useSearchParams();
  const [tickerA, setTickerA] = useState(params.get('a') ?? '');
  const [tickerB, setTickerB] = useState(params.get('b') ?? '');
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [allAcoes, setAllAcoes] = useState<Acao[]>([]);
  const [perfil] = useState<Perfil>('dividendos');

  useEffect(() => {
    api.getAcoes().then(setAllAcoes).catch(() => {});
    api.getPerfil()
      .then((res) => {
        const p: Perfil = res?.perfil ?? 'dividendos';
        return api.getRanking(p);
      })
      .then(setRankingItems)
      .catch(() => {});
  }, []);

  const allTickers = useMemo(() => allAcoes.map((a) => a.ticker), [allAcoes]);

  const findAcao = (t: string): Acao | null =>
    allAcoes.find((a) => a.ticker === t.toUpperCase()) ?? null;
  const findRanking = (t: string): RankingItem | null =>
    rankingItems.find((r) => r.acao.ticker === t.toUpperCase()) ?? null;

  const acaoA = findAcao(tickerA);
  const acaoB = findAcao(tickerB);
  const rankA = findRanking(tickerA);
  const rankB = findRanking(tickerB);

  const canCompare = !!acaoA && !!acaoB;

  // Atualiza query params quando os tickers mudam
  useEffect(() => {
    const p: Record<string, string> = {};
    if (tickerA) p.a = tickerA;
    if (tickerB) p.b = tickerB;
    setParams(p, { replace: true });
  }, [tickerA, tickerB, setParams]);

  // Dados para RadarChart
  const radarData = useMemo(() => {
    if (!rankA || !rankB) return [];
    return [
      { metric: 'Fundamentalista', A: rankA.score.fundamental.total, B: rankB.score.fundamental.total },
      { metric: 'Momento',         A: rankA.score.momentum.total,     B: rankB.score.momentum.total },
      { metric: 'P/L',             A: rankA.score.fundamental.pl_score ?? 0,      B: rankB.score.fundamental.pl_score ?? 0 },
      { metric: 'P/VP',            A: rankA.score.fundamental.pvp_score ?? 0,     B: rankB.score.fundamental.pvp_score ?? 0 },
      { metric: 'ROE',             A: rankA.score.fundamental.roe_score ?? 0,      B: rankB.score.fundamental.roe_score ?? 0 },
      { metric: 'DY',              A: rankA.score.fundamental.dy_score ?? 0,       B: rankB.score.fundamental.dy_score ?? 0 },
    ];
  }, [rankA, rankB]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono text-gold-dk tracking-[0.3em] uppercase block mb-1">
          Análise Comparativa
        </span>
        <h1 className="font-display text-3xl sm:text-4xl italic text-ink">Comparar Ativos</h1>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_40px_1fr] items-end gap-3">
        <TickerInput label="Ativo A" value={tickerA} onChange={setTickerA} allTickers={allTickers} />
        <div className="text-center font-mono text-ink3 text-sm pb-2 hidden sm:block">vs</div>
        <TickerInput label="Ativo B" value={tickerB} onChange={setTickerB} allTickers={allTickers} />
      </div>

      {!canCompare && (tickerA || tickerB) && (
        <p className="text-ink3 font-mono text-xs">
          {!acaoA && tickerA && `"${tickerA}" não encontrado no banco. Execute o sync primeiro.`}
          {!acaoB && tickerB && ` "${tickerB}" não encontrado no banco.`}
        </p>
      )}

      {canCompare && (
        <>
          {/* Cards lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StockCard
              acao={acaoA}
              score={rankA?.score}
              highlight={rankA && rankB ? {
                roe:        better(acaoA.roe, acaoB.roe)[0],
                dy:         better(acaoA.dividend_yield, acaoB.dividend_yield)[0],
                net_margin: better(acaoA.net_margin, acaoB.net_margin)[0],
                pl:         better(acaoA.pl, acaoB.pl, false)[0],
                pvp:        better(acaoA.pvp, acaoB.pvp, false)[0],
                var_252d:   better(acaoA.var_252d, acaoB.var_252d)[0],
              } : {}}
            />
            <StockCard
              acao={acaoB}
              score={rankB?.score}
              highlight={rankA && rankB ? {
                roe:        better(acaoA.roe, acaoB.roe)[1],
                dy:         better(acaoA.dividend_yield, acaoB.dividend_yield)[1],
                net_margin: better(acaoA.net_margin, acaoB.net_margin)[1],
                pl:         better(acaoA.pl, acaoB.pl, false)[1],
                pvp:        better(acaoA.pvp, acaoB.pvp, false)[1],
                var_252d:   better(acaoA.var_252d, acaoB.var_252d)[1],
              } : {}}
            />
          </div>

          {/* RadarChart — só se ambos têm score */}
          {rankA && rankB && radarData.length > 0 && (
            <div className="panel p-6">
              <p className="text-[10px] font-mono text-ink3 uppercase tracking-widest mb-4 text-center">
                Comparação por componente de score
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 8, right: 40, bottom: 8, left: 40 }}>
                  <PolarGrid stroke="#20253A" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: '#7E8499', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                  />
                  <Radar name={tickerA} dataKey="A" stroke="#D4A843" fill="#D4A843" fillOpacity={0.15} strokeWidth={1.5} />
                  <Radar name={tickerB} dataKey="B" stroke="#3ECC91" fill="#3ECC91" fillOpacity={0.12} strokeWidth={1.5} />
                  <ReTooltip
                    contentStyle={{
                      backgroundColor: '#161A26',
                      border: '1px solid #20253A',
                      borderRadius: '6px',
                      fontFamily: 'IBM Plex Mono',
                      fontSize: '11px',
                      color: '#EDE8DC',
                    }}
                    formatter={(v: number, name: string) => [v.toFixed(1), name === 'A' ? tickerA : tickerB]}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-ink2">
                  <span className="w-3 h-0.5 bg-gold inline-block" />{tickerA}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-ink2">
                  <span className="w-3 h-0.5 bg-up inline-block" />{tickerB}
                </span>
              </div>
            </div>
          )}

          {/* Tabela comparativa métrica a métrica */}
          <div className="panel p-4">
            <p className="text-[10px] font-mono text-ink3 uppercase tracking-widest mb-4 text-center">
              Métricas comparadas
            </p>

            <div className="grid grid-cols-[1fr_auto_1fr] mb-2">
              <span className="ticker text-sm text-right">{acaoA.ticker}</span>
              <span className="w-20" />
              <span className="ticker text-sm text-left">{acaoB.ticker}</span>
            </div>

            {(() => {
              const [wA_price] = better(acaoA.current_price, acaoB.current_price);
              const [wA_pl, wB_pl] = better(acaoA.pl, acaoB.pl, false);
              const [wA_pvp, wB_pvp] = better(acaoA.pvp, acaoB.pvp, false);
              const [wA_roe, wB_roe] = better(acaoA.roe, acaoB.roe);
              const [wA_dy, wB_dy] = better(acaoA.dividend_yield, acaoB.dividend_yield);
              const [wA_mg, wB_mg] = better(acaoA.net_margin, acaoB.net_margin);
              const [wA_v, wB_v] = better(acaoA.var_252d, acaoB.var_252d);
              const [wA_sc, wB_sc] = rankA && rankB ? better(rankA.score.composite, rankB.score.composite) : [false, false];

              return (
                <>
                  <CompareRow label="Score"   valA={rankA ? rankA.score.composite.toFixed(0) : '-'} valB={rankB ? rankB.score.composite.toFixed(0) : '-'} winnerA={wA_sc} winnerB={wB_sc} />
                  <CompareRow label="Preço"   valA={fmt.currency(acaoA.current_price)} valB={fmt.currency(acaoB.current_price)} />
                  <CompareRow label="P/L"     valA={fmt.num(acaoA.pl, 1)}    valB={fmt.num(acaoB.pl, 1)}    winnerA={wA_pl}  winnerB={wB_pl} />
                  <CompareRow label="P/VP"    valA={fmt.num(acaoA.pvp, 2)}   valB={fmt.num(acaoB.pvp, 2)}   winnerA={wA_pvp} winnerB={wB_pvp} />
                  <CompareRow label="ROE"     valA={fmt.pct(acaoA.roe)}      valB={fmt.pct(acaoB.roe)}      winnerA={wA_roe} winnerB={wB_roe} />
                  <CompareRow label="DY"      valA={fmt.pct(acaoA.dividend_yield)} valB={fmt.pct(acaoB.dividend_yield)} winnerA={wA_dy} winnerB={wB_dy} />
                  <CompareRow label="Margem"  valA={fmt.pct(acaoA.net_margin)} valB={fmt.pct(acaoB.net_margin)} winnerA={wA_mg} winnerB={wB_mg} />
                  <CompareRow label="252d"    valA={fmt.pctDelta(acaoA.var_252d)} valB={fmt.pctDelta(acaoB.var_252d)} winnerA={wA_v} winnerB={wB_v} varA={acaoA.var_252d} varB={acaoB.var_252d} />
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
