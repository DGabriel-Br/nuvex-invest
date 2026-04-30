import { useRef, useState } from 'react';

/** Conteúdo educativo estático — nunca gerado por IA. */
const CONTENT: Record<string, string> = {
  pl:
    'P/L (Preço/Lucro): Quantos anos levaria para recuperar o investimento com o lucro atual. Entre 5 e 20 é comum em empresas sólidas. Valores muito altos indicam expectativa de crescimento futuro.',
  pvp:
    'P/VP (Preço/Valor Patrimonial): Compara o preço de mercado com o valor contábil da empresa. Abaixo de 1 significa que você paga menos do que o patrimônio registrado.',
  roe:
    'ROE (Retorno sobre Patrimônio): Quanto a empresa gera de lucro em relação ao capital dos acionistas. Acima de 15% ao ano é considerado bom; acima de 25% é excelente.',
  dy:
    'Dividend Yield: Percentual do preço pago em dividendos e JCP nos últimos 12 meses. Fundamental para investidores que buscam renda passiva.',
  net_margin:
    'Margem Líquida: De cada R$ 100 de receita, quanto sobra como lucro. Acima de 15% indica boa eficiência operacional. Varia muito por setor.',
  lpa:
    'LPA (Lucro Por Ação): Lucro total da empresa dividido pelo número de ações emitidas. É a base do cálculo do P/L.',
  vpa:
    'VPA (Valor Patrimonial Por Ação): Patrimônio líquido da empresa dividido pelo número de ações. É a base do cálculo do P/VP.',
  var_30d:
    'Variação 30 dias: Quanto o preço da ação subiu ou caiu no último mês. Indica o momento recente de curto prazo.',
  var_90d:
    'Variação 90 dias: Desempenho do preço nos últimos 3 meses. Captura tendências de médio prazo.',
  var_252d:
    'Variação 252 dias: Desempenho do preço nos últimos 12 meses de bolsa (252 pregões úteis). Principal indicador de momento.',
  relative_volume:
    'Volume Relativo: Volume negociado hoje dividido pela média dos últimos 20 pregões. Acima de 1,5 indica interesse aumentado dos investidores.',
  score:
    'Score Composto (0–100): Nota que combina análise fundamentalista e de momento, ponderada pelo seu perfil. Quanto maior, mais adequada a ação ao seu perfil.',
  fundamental:
    'Score Fundamentalista: Avalia a saúde financeira da empresa com base em P/L, P/VP, ROE, Dividend Yield e Margem Líquida.',
  momentum:
    'Score de Momento: Avalia a força recente do preço com base nas variações de 30, 90 e 252 dias e no volume relativo de negociação.',
  dividends_per_share:
    'Proventos por Ação (DPA): Total de dividendos e JCP pagos por ação nos últimos 12 meses. Base do cálculo do Preço Teto pelo modelo Bazin.',
};

interface TooltipProps {
  indicator: string;
  position?: 'top' | 'bottom';
}

export function Tooltip({ indicator, position = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const content = CONTENT[indicator];

  if (!content) return null;

  const show = () => {
    clearTimeout(timerRef.current);
    setOpen(true);
  };
  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="w-3.5 h-3.5 rounded-full border border-ink3 text-ink3 text-[9px] font-mono
                   flex items-center justify-center hover:border-gold hover:text-gold
                   transition-colors cursor-help ml-1 shrink-0 leading-none"
        aria-label={`Saiba mais sobre ${indicator.toUpperCase()}`}
      >
        ?
      </button>

      {open && (
        <span
          onMouseEnter={show}
          onMouseLeave={hide}
          className={`
            absolute z-50 w-60 p-3 rounded-lg bg-card border border-wire2
            text-[11px] leading-relaxed text-ink2 shadow-2xl animate-fade-in
            left-1/2 -translate-x-1/2
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
        >
          {content}
          <span
            className={`
              absolute left-1/2 -translate-x-1/2 border-4 border-transparent
              ${position === 'top'
                ? 'top-full border-t-wire2'
                : 'bottom-full border-b-wire2'}
            `}
          />
        </span>
      )}
    </span>
  );
}
