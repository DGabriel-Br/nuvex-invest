import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Perfil } from '../types';

interface ProfileCardProps {
  perfil: Perfil;
  selected: boolean;
  onSelect: () => void;
}

const PROFILES = {
  dividendos: {
    title: 'DIVIDENDOS',
    subtitle: 'Renda Passiva',
    description:
      'Empresas consolidadas que distribuem proventos regularmente. Foco em solidez patrimonial, DY elevado e P/VP atrativo.',
    metrics: ['DY > 5%', 'P/VP < 2', 'ROE > 12%'],
    gradient: 'from-[#0A0E1A] via-[#0D1525] to-[#111830]',
    accent: 'from-[#1A2840] to-[#0F1D35]',
    pattern: `repeating-linear-gradient(
      90deg,
      rgba(212,168,67,0.03) 0px,
      rgba(212,168,67,0.03) 1px,
      transparent 1px,
      transparent 48px
    )`,
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
        <rect x="4" y="24" width="6" height="12" rx="1" fill="#D4A843" opacity="0.5" />
        <rect x="12" y="18" width="6" height="18" rx="1" fill="#D4A843" opacity="0.7" />
        <rect x="20" y="10" width="6" height="26" rx="1" fill="#D4A843" opacity="0.9" />
        <rect x="28" y="4" width="6" height="32" rx="1" fill="#D4A843" />
        <path d="M6 20 L14 14 L22 6 L32 2" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
  },
  crescimento: {
    title: 'CRESCIMENTO',
    subtitle: 'Valorização',
    description:
      'Empresas em expansão com alto retorno sobre capital e forte momentum de preço. Foco em escalabilidade e margem crescente.',
    metrics: ['ROE > 20%', 'Margem > 15%', 'Momento ↑'],
    gradient: 'from-[#080E11] via-[#0B1519] to-[#0E1C20]',
    accent: 'from-[#102520] to-[#0A1A18]',
    pattern: `repeating-linear-gradient(
      -45deg,
      rgba(62,204,145,0.025) 0px,
      rgba(62,204,145,0.025) 1px,
      transparent 1px,
      transparent 28px
    )`,
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
        <path
          d="M6 32 L16 20 L22 26 L34 10"
          stroke="#3ECC91"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 10 L34 10 L34 16"
          stroke="#3ECC91"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="34" cy="10" r="2.5" fill="#3ECC91" opacity="0.8" />
      </svg>
    ),
  },
} satisfies Record<Perfil, object>;

function ProfileCard({ perfil, selected, onSelect }: ProfileCardProps) {
  const p = PROFILES[perfil];
  const isDiv = perfil === 'dividendos';
  const borderColor = isDiv ? 'border-gold' : 'border-up';
  const textAccent = isDiv ? 'text-gold' : 'text-up';
  const badgeBg = isDiv ? 'bg-gold/10 text-gold border-gold/20' : 'bg-up/10 text-up border-up/20';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative flex flex-col p-8 rounded-2xl text-left
        border-2 transition-all duration-300 cursor-pointer
        bg-gradient-to-br ${p.gradient}
        ${selected
          ? `${borderColor} shadow-[0_0_40px_rgba(0,0,0,0.6)]`
          : 'border-wire2 hover:border-wire opacity-80 hover:opacity-100'}
      `}
      style={{ backgroundImage: `${p.pattern}, linear-gradient(135deg, var(--tw-gradient-stops))` }}
      aria-pressed={selected}
    >
      {/* Checkmark */}
      <div className={`
        absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
        transition-all duration-200
        ${selected ? `${borderColor} ${isDiv ? 'bg-gold' : 'bg-up'}` : 'border-wire2'}
      `}>
        {selected && (
          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#08090E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Ícone */}
      <div className="mb-5">{p.icon}</div>

      {/* Título */}
      <span className={`font-mono font-semibold tracking-[0.2em] text-sm uppercase ${textAccent}`}>
        {p.title}
      </span>
      <span className="font-display italic text-3xl text-ink mt-1 leading-tight">
        {p.subtitle}
      </span>

      {/* Descrição */}
      <p className="text-ink2 text-xs leading-relaxed mt-3 font-body">
        {p.description}
      </p>

      {/* Métricas badge */}
      <div className="flex flex-wrap gap-1.5 mt-5">
        {p.metrics.map((m) => (
          <span key={m} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeBg}`}>
            {m}
          </span>
        ))}
      </div>
    </button>
  );
}

export function Onboarding() {
  const [selected, setSelected] = useState<Perfil | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Verifica se já tem perfil salvo
  useEffect(() => {
    api.getPerfil().then((res) => {
      if (res?.perfil) navigate('/ranking', { replace: true });
    }).catch(() => {});
  }, [navigate]);

  const handleSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.savePerfil(selected);
      navigate('/ranking');
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{
           backgroundImage: `
             radial-gradient(ellipse 100% 60% at 50% 0%, rgba(212,168,67,0.04), transparent),
             radial-gradient(ellipse 60% 40% at 80% 80%, rgba(62,204,145,0.03), transparent)
           `
         }}>
      {/* Logo */}
      <div className="mb-12 text-center">
        <span className="font-mono text-[11px] tracking-[0.5em] text-gold-dk uppercase">NUVEX</span>
        <h1 className="font-display text-4xl sm:text-5xl text-ink mt-2 italic">
          Qual é o seu perfil?
        </h1>
        <p className="text-ink2 text-sm mt-2 font-body max-w-sm mx-auto">
          Escolha o perfil que melhor representa seu objetivo como investidor.
          Você poderá alterar depois.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {(['dividendos', 'crescimento'] as Perfil[]).map((p) => (
          <ProfileCard
            key={p}
            perfil={p}
            selected={selected === p}
            onSelect={() => setSelected(p)}
          />
        ))}
      </div>

      {/* CTA */}
      <div className={`mt-8 transition-all duration-500 ${selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !selected}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Começar'}
          {!saving && (
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
