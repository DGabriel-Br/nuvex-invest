import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Compare } from './pages/Compare';
import { Onboarding } from './pages/Onboarding';
import { Ranking } from './pages/Ranking';
import { StockDetail } from './pages/StockDetail';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"               element={<Onboarding />} />
        <Route path="/ranking"        element={<Ranking />} />
        <Route path="/acoes/:ticker"  element={<StockDetail />} />
        <Route path="/comparar"       element={<Compare />} />
        {/* Rota catch-all */}
        <Route path="*"               element={<Navigate to="/ranking" replace />} />
      </Routes>
    </Layout>
  );
}
