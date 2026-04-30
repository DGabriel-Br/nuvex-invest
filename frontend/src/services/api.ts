import type { Acao, Perfil, PerfilResponse, RankingItem } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getAcoes: () => get<Acao[]>('/acoes'),

  getAcao: (ticker: string) => get<Acao>(`/acoes/${ticker.toUpperCase()}`),

  getRanking: (perfil: Perfil) =>
    get<RankingItem[]>(`/ranking?perfil=${perfil}`),

  getPerfil: () => get<PerfilResponse | null>('/perfil'),

  savePerfil: (perfil: Perfil) =>
    post<PerfilResponse>('/perfil', { perfil }),
};
