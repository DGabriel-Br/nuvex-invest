import { Link } from 'react-router-dom';
import type { RankingItem } from '../types';
import { fmt, varColor } from '../utils/format';
import { ScoreCell } from './ScoreBar';
import { Tooltip } from './Tooltip';

interface RankingTableProps {
  items: RankingItem[];
}

const TH = ({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) => (
  <th className="px-3 py-3 text-left text-[10px] font-mono text-ink3 uppercase tracking-widest font-normal whitespace-nowrap">
    <span className="flex items-center gap-0.5">
      {children}
      {tooltip && <Tooltip indicator={tooltip} position="bottom" />}
    </span>
  </th>
);

export function RankingTable({ items }: RankingTableProps) {
  if (items.length === 0) {
    return (
      <div className="panel flex items-center justify-center py-20 text-ink3 font-mono text-sm">
        Nenhuma ação encontrada.
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-wire">
              <TH>#</TH>
              <TH>Ticker</TH>
              <TH>Nome</TH>
              <TH tooltip="score">Score</TH>
              <TH>Preço</TH>
              <TH tooltip="pl">P/L</TH>
              <TH tooltip="pvp">P/VP</TH>
              <TH tooltip="dy">DY</TH>
              <TH tooltip="roe">ROE</TH>
              <TH tooltip="var_252d">252d</TH>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.acao.ticker}
                className="border-b border-wire/50 hover:bg-rowh transition-colors group"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Rank */}
                <td className="px-3 py-2.5 font-mono text-[11px] text-ink3 w-8">
                  {item.rank}
                </td>

                {/* Ticker */}
                <td className="px-3 py-2.5 w-20">
                  <Link
                    to={`/acoes/${item.acao.ticker}`}
                    className="ticker text-sm hover:text-gold-lt transition-colors"
                  >
                    {item.acao.ticker}
                  </Link>
                </td>

                {/* Nome */}
                <td className="px-3 py-2.5 max-w-[180px]">
                  <span className="text-ink2 text-xs truncate block" title={item.acao.name}>
                    {item.acao.name}
                  </span>
                  {item.acao.segment && (
                    <span className="text-ink3 text-[10px] font-mono truncate block">
                      {item.acao.segment}
                    </span>
                  )}
                </td>

                {/* Score */}
                <td className="px-3 py-2.5 w-28">
                  <ScoreCell value={item.score.composite} />
                </td>

                {/* Preço */}
                <td className="px-3 py-2.5 font-mono text-xs text-ink whitespace-nowrap">
                  {fmt.currency(item.acao.current_price)}
                </td>

                {/* P/L */}
                <td className={`px-3 py-2.5 font-mono text-xs ${item.acao.pl == null ? 'text-ink3' : 'text-ink'}`}>
                  {fmt.num(item.acao.pl, 1)}
                </td>

                {/* P/VP */}
                <td className={`px-3 py-2.5 font-mono text-xs ${item.acao.pvp == null ? 'text-ink3' : 'text-ink'}`}>
                  {fmt.num(item.acao.pvp, 2)}
                </td>

                {/* DY */}
                <td className={`px-3 py-2.5 font-mono text-xs ${item.acao.dividend_yield == null ? 'text-ink3' : 'text-up'}`}>
                  {fmt.pct(item.acao.dividend_yield)}
                </td>

                {/* ROE */}
                <td className={`px-3 py-2.5 font-mono text-xs ${item.acao.roe == null ? 'text-ink3' : 'text-ink'}`}>
                  {fmt.pct(item.acao.roe)}
                </td>

                {/* Var 252d */}
                <td className={`px-3 py-2.5 font-mono text-xs ${varColor(item.acao.var_252d)}`}>
                  {fmt.pctDelta(item.acao.var_252d)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
