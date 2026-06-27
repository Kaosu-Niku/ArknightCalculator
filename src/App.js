import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React from 'react';
import './App.css';
import Header from './component/Header';
import MainContent from './component/MainContent';
import Footer from './component/Footer';
import LogPanel from './component/LogPanel';
import { useLanguage } from './context/LanguageContext';

function App() {
  const { t } = useLanguage();

  return (
    <div className="app-shell">
      <Header />
      <MainContent />
      <Footer />
      <LogPanel />

      <nav className="mobile-dock" aria-label={t('快速導覽')}>
        <a href="#enemy_form"><span>01</span>{t('參數')}</a>
        <a href="#member_table"><span>03</span>{t('幹員')}</a>
        <a href="#attackSkill_table"><span>04</span>{t('傷害')}</a>
        <a href="#healingSkill_table"><span>05</span>{t('治療')}</a>
      </nav>
    </div>
  );
}

export default App;
