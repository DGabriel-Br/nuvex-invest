import { Link } from 'react-router-dom';
import type { Acao, Score } from '../types';
import { fmt, varColor } from '../utils/format';
import { ScoreBar } from './ScoreBar';

interface StockCardProps {
  acao: Acao;
  score?: Score;
  highlight?: Record<string, boolean>; // métrica → é o vencedor na comparação?
}

interface MetricRowProps {
  label: string;
  value: string;
  winner?: boolean;
}

function MetricRow({ label, value, winner }: MetricRowProps) {
  return (
    <div className={`flex justify-between items-center py-2 border-b border-wire last:border-0 ${winner ? 'text-up' : ''}`}>
      <span className="text-[11px] text-ink2 uppercase tracking-wider font-mono">{label}</span>
      <span className={`font-mono text-sm ${value === '-' ? 'text-ink3' : winner ? 'text-up font-semibold' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}

export function StockCard({ acao, score, highlight = {} }: StockCardProps) {
  return (
    <div className="panel p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to={`/acoes/${acao.ticker}`}
            className="ticker text-xl hover:text-gold-lt transition-colors"
          >
            {acao.ticker}
          </Link>
          <p className="text-ink2 text-xs mt-0.5 leading-snug">{acao.name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold text-lg text-ink">
            {fmt.currency(acao.current_price)}
          </p>
          {acao.var_252d !== null && (
            <p className={`text-xs font-mono ${varColor(acao.var_252d)}`}>
              {fmt.pctDelta(acao.var_252d)} <span className="text-ink3">252d</span>
            </p>
          )}
        </div>
      </div>

      {/* Score composto */}
      {score && (
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-ink3 uppercase tracking-widest">Score</span>
          </div>
          <ScoreBar value={score.composite} size="lg" />
          <div className="grid grid-cols-2 gap-1 mt-1">
            <ScoreBar value={score.fundamental.total} label="Fundamentalista" size="sm" />
            <ScoreBar value={score.momentum.total} label="Momento" size="sm" />
          </div>
        </div>
      )}

      {/* Segmento */}
      {acao.segment && (
        <span className="badge self-start">{acao.segment}</span>
      )}

      {/* Métricas fundamentais */}
      <div>
        <MetricRow label="P/L"    value={fmt.num(acao.pl, 1)}         winner={highlight['pl']} />
        <MetricRow label="P/VP"   value={fmt.num(acao.pvp, 2)}        winner={highlight['pvp']} />
        <MetricRow label="ROE"    value={fmt.pct(acao.roe)}            winner={highlight['roe']} />
        <MetricRow label="DY"     value={fmt.pct(acao.dividend_yield)} winner={highlight['dy']} />
        <MetricRow label="Margem" value={fmt.pct(acao.net_margin)}     winner={highlight['net_margin']} />
        <MetricRow label="Var 252d" value={fmt.pctDelta(acao.var_252d)} winner={highlight['var_252d']} />
      </div>
    </div>
  );
}
