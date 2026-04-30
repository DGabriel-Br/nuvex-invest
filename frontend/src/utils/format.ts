/** Todas as funções retornam '-' quando o valor é null ou undefined. */

const DASH = '-';

export const fmt = {
  /** R$ 45,20 */
  currency(v: number | null | undefined): string {
    if (v == null) return DASH;
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  /** 8,3% (valor já em decimal: 0.083 → "8,3%") */
  pct(v: number | null | undefined): string {
    if (v == null) return DASH;
    return `${(v * 100).toFixed(1)}%`;
  },

  /** +12,3% ou −5,1% (valor já em percentual direto: 12.3 → "+12,3%") */
  pctDelta(v: number | null | undefined): string {
    if (v == null) return DASH;
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}%`;
  },

  /** Número com casas decimais */
  num(v: number | null | undefined, dec = 2): string {
    if (v == null) return DASH;
    return v.toFixed(dec);
  },

  /** Score inteiro: "76" */
  score(v: number | null | undefined): string {
    if (v == null) return DASH;
    return v.toFixed(0);
  },
};

/** Classe Tailwind para colorir variação (positivo=up, negativo=dn, null=ink3) */
export function varColor(v: number | null | undefined): string {
  if (v == null) return 'text-ink3';
  if (v > 0) return 'text-up';
  if (v < 0) return 'text-dn';
  return 'text-ink2';
}

/** Cor hexadecimal do score (0-100) para uso inline */
export function scoreColor(v: number): string {
  if (v >= 70) return '#3ECC91';  // up / verde
  if (v >= 40) return '#F5C055';  // caution / âmbar
  return '#E05555';               // dn / vermelho
}
