import { Link, NavLink, useLocation } from 'react-router-dom';

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `font-mono text-xs tracking-widest uppercase px-3 py-1.5 rounded transition-colors
         ${isActive
           ? 'text-gold border border-gold/30 bg-gold/5'
           : 'text-ink2 hover:text-ink border border-transparent'
         }`
      }
    >
      {children}
    </NavLink>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const isOnboarding = loc.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav — oculta na tela de onboarding */}
      {!isOnboarding && (
        <header className="sticky top-0 z-40 border-b border-wire bg-base/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
            {/* Logo */}
            <Link to="/ranking" className="flex items-center gap-2 group">
              <span className="text-gold font-mono text-xs tracking-[0.3em] uppercase font-semibold
                               group-hover:text-gold-lt transition-colors">
                NUVEX
              </span>
              <span className="text-ink3 font-mono text-[10px] tracking-wider hidden sm:block">
                / B3
              </span>
            </Link>

            {/* Links */}
            <nav className="flex items-center gap-1">
              <NavItem to="/ranking">Ranking</NavItem>
              <NavItem to="/comparar">Comparar</NavItem>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {/* Footer mínimo */}
      {!isOnboarding && (
        <footer className="border-t border-wire py-4">
          <p className="text-center text-ink3 font-mono text-[10px] tracking-wider">
            NUVEX · Dados via yfinance · Apenas educacional, não é recomendação de investimento
          </p>
        </footer>
      )}
    </div>
  );
}
