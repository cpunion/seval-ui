/**
 * Main App Component
 *
 * Sets up routing between the home page and demo apps
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage.tsx';
import { CalculatorPage } from './pages/CalculatorPage.tsx';
import { VocabularyPage } from './pages/VocabularyPage.tsx';
import { ShowcasePage } from './pages/ShowcasePage.tsx';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <nav className="top-nav">
        <Link to="/" className="nav-brand">A2UI S-Expr Demo</Link>
        <div className="nav-links">
          <Link to="/showcase">Showcase</Link>
          <Link to="/calculator">Calculator</Link>
          <Link to="/vocabulary">Vocabulary</Link>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
