export type Perfil = 'dividendos' | 'crescimento';

export interface Acao {
  ticker: string;
  name: string;
  segment: string | null;
  current_price: number | null;
  lpa: number | null;
  vpa: number | null;
  pl: number | null;
  pvp: number | null;
  roe: number | null;
  dividend_yield: number | null;
  net_margin: number | null;
  dividends_per_share: number | null;
  var_30d: number | null;
  var_90d: number | null;
  var_252d: number | null;
  relative_volume: number | null;
}

export interface ScoreFundamentalista {
  pl_score: number | null;
  pvp_score: number | null;
  roe_score: number | null;
  dy_score: number | null;
  net_margin_score: number | null;
  total: number;
}

export interface ScoreMomento {
  var_30d: number | null;
  var_90d: number | null;
  var_252d: number | null;
  relative_volume: number | null;
  total: number;
}

export interface Score {
  fundamental: ScoreFundamentalista;
  momentum: ScoreMomento;
  composite: number;
}

export interface RankingItem {
  rank: number;
  acao: Acao;
  score: Score;
}

export interface PerfilResponse {
  perfil: Perfil;
}
