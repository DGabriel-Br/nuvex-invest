import { useEffect, useRef } from 'react';
import { scoreColor } from '../utils/format';

interface ScoreBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function ScoreBar({
  value,
  label,
  showValue = true,
  size = 'md',
  animated = true,
}: ScoreBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const color = scoreColor(value);

  const heights: Record<string, string> = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };
  const h = heights[size];

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    // força reflow antes da animação para garantir que parte do zero
    el.style.width = '0%';
    const id = requestAnimationFrame(() => {
      el.style.width = `${value}%`;
    });
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className="flex items-center gap-2.5 w-full">
      {label && (
        <span className="text-[11px] font-mono text-ink2 w-24 shrink-0 truncate">{label}</span>
      )}
      <div className={`flex-1 ${h} bg-wire rounded-full overflow-hidden`}>
        <div
          ref={fillRef}
          className={`h-full rounded-full ${animated ? 'transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]' : ''}`}
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      {showValue && (
        <span
          className="font-mono text-[11px] w-6 text-right tabular-nums shrink-0"
          style={{ color }}
        >
          {value.toFixed(0)}
        </span>
      )}
    </div>
  );
}

/** Versão compacta usada inline na tabela */
export function ScoreCell({ value }: { value: number }) {
  const color = scoreColor(value);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1 bg-wire rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums" style={{ color }}>
        {value.toFixed(0)}
      </span>
    </div>
  );
}
