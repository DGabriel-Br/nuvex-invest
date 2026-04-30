import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ScoreBar } from '../components/ScoreBar';
import { Tooltip } from '../components/Tooltip';
import { useStock } from '../hooks/useStock';
import { fmt, varColor } from '../utils/format';

interface ChartPoint {
  period: string;
  price: number;
}

function useChartData(acao: { current_price: number | null; var_30d: number | null; var_90d: number | null; var_252d: number | null }): ChartPoint[] {
  return useMemo(() => {
    if (!acao.current_price) return [];
    const p = acao.current_price;
    const pts: ChartPoint[] = [];

    if (acao.var_252d !== null)
      pts.push({ period: '1 ano', price: +(p / (1 + acao.var_252d / 100)).toFixed(2) });
    if (acao.var_90d !== null)
      pts.push({ period: '3 meses', price: +(p / (1 + acao.var_90d / 100)).toFixed(2) });
    if (acao.var_30d !== null)
      pts.push({ period: '1 mês', price: +(p / (1 + acao.var_30d / 100)).toFixed(2) });
    pts.push({ period: 'Hoje', price: +p.toFixed(2) });

    return pts;
  }, [acao]);
}

function MetricBlock({
  label,
  value,
  sub,
  indicator,
}: {
  label: string;
  value: string;
  sub?: string;
  indicator?: string;
}) {
  return (
    <div className="panel p-4 flex flex-col gap-1">
      <div className="flex items-center gap-0.5">
        <span className="text-[10px] font-mono text-ink3 uppercase tracking-widest">{label}</span>
        {indicator && <Tooltip indicator={indicator} />}
      </div>
      <span className={`font-mono text-xl font-semibold ${value === '-' ? 'text-ink3' : 'text-ink'}`}>
        {value}
      </span>
      {sub && <span className="text-ink3 text-[10px] font-mono">{sub}</span>}
    </div>
  );
}

export function StockDetail() {
  const { ticker = '' } = useParams<{ ticker: string }>();
  const { acao, loading, error } = useStock(ticker);
  const chartData = useChartData(acao ?? { current_price: null, var_30d: null, var_90d: null, var_252d: null });

  const isChartUp =
    chartData.length >= 2
      ? chartData[chartData.length - 1].price >= chartData[0].price
      : true;

  const chartColor = isChartUp ? '#3ECC91' : '#E05555';

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center gap-3">
        <span className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <span className="text-ink2 font-mono text-sm">Carregando {ticker.toUpperCase()}…</span>
      </div>
    );
  }

  if (error || !acao) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <p className="text-dn font-mono text-sm">{error ?? 'Ação não encontrada.'}</p>
        <Link to="/ranking" className="mt-3 inline-block btn-ghost text-xs">← Voltar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-up">
      {/* Breadcrumb */}
      <Link to="/ranking" className="text-ink3 font-mono text-xs hover:text-gold transition-colors flex items-center gap-1">
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Ranking
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="ticker text-4xl">{acao.ticker}</span>
            {acao.segment && <span className="badge">{acao.segment}</span>}
          </div>
          <p className="text-ink2 text-sm mt-1 font-body">{acao.name}</p>
        </div>

        <div className="text-right sm:pb-1">
          <p className="font-mono text-3xl font-semibold text-ink">
            {fmt.currency(acao.current_price)}
          </p>
          <div className="flex gap-3 justify-end mt-1 flex-wrap">
            {[
              { label: '30d', val: acao.var_30d },
              { label: '90d', val: acao.var_90d },
              { label: '252d', val: acao.var_252d },
            ].map(({ label, val }) => (
              val !== null && (
                <span key={label} className={`font-mono text-xs ${varColor(val)}`}>
                  {fmt.pctDelta(val)}{' '}
                  <span className="text-ink3">{label}</span>
                </span>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico + Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de preço */}
        <div className="panel p-4 lg:col-span-2">
          <p className="text-[10px] font-mono text-ink3 uppercase tracking-widest mb-3">
            Tendência de preço (dados aproximados)
          </p>
          {chartData.length < 2 ? (
            <div className="flex items-center justify-center h-36 text-ink3 font-mono text-xs">
              Histórico insuficiente
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#20253A" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fill: '#3E4358', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#3E4358', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                  width={56}
                />
                <ReTooltip
                  contentStyle={{
                    backgroundColor: '#161A26',
                    border: '1px solid #20253A',
                    borderRadius: '6px',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '11px',
                    color: '#EDE8DC',
                  }}
                  formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Preço']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={{ fill: chartColor, r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: chartColor, r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scores */}
        <div className="panel p-4 flex flex-col gap-4">
          <p className="text-[10px] font-mono text-ink3 uppercase tracking-widest">
            Score por componente
          </p>
          <div className="space-y-2">
            <ScoreBar value={0} label="Composto" size="lg" animated={false} />
            <div className="text-center text-ink3 font-mono text-[10px] py-2">
              — Score disponível após ranking —
            </div>
          </div>

          {/* Métricas compactas */}
          <div className="space-y-2 mt-auto">
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-ink3">LPA <Tooltip indicator="lpa" /></span>
              <span className={`font-mono text-xs ${acao.lpa == null ? 'text-ink3' : 'text-ink'}`}>{fmt.currency(acao.lpa)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-ink3">VPA <Tooltip indicator="vpa" /></span>
              <span className={`font-mono text-xs ${acao.vpa == null ? 'text-ink3' : 'text-ink'}`}>{fmt.currency(acao.vpa)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-ink3">DPA <Tooltip indicator="dividends_per_share" /></span>
              <span className={`font-mono text-xs ${acao.dividends_per_share == null ? 'text-ink3' : 'text-ink'}`}>{fmt.currency(acao.dividends_per_share)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-ink3">Vol Rel <Tooltip indicator="relative_volume" /></span>
              <span className={`font-mono text-xs ${acao.relative_volume == null ? 'text-ink3' : 'text-ink'}`}>{fmt.num(acao.relative_volume, 2)}×</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fundamentalistas */}
      <div>
        <p className="text-[10px] font-mono text-ink3 uppercase tracking-widest mb-3">
          Indicadores fundamentalistas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricBlock label="P/L"     value={fmt.num(acao.pl, 1)}          indicator="pl" />
          <MetricBlock label="P/VP"    value={fmt.num(acao.pvp, 2)}          indicator="pvp" />
          <MetricBlock label="ROE"     value={fmt.pct(acao.roe)}             indicator="roe" />
          <MetricBlock label="DY"      value={fmt.pct(acao.dividend_yield)}  indicator="dy" />
          <MetricBlock label="Margem"  value={fmt.pct(acao.net_margin)}      indicator="net_margin" />
        </div>
      </div>

      {/* Link para comparar */}
      <div className="text-right">
        <Link
          to={`/comparar?a=${acao.ticker}`}
          className="text-ink3 font-mono text-xs hover:text-gold transition-colors"
        >
          Comparar com outra ação →
        </Link>
      </div>
    </div>
  );
}
