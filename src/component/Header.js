import React from 'react';
import { useLanguage } from '../context/LanguageContext';

function Header() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="app-header">
      <div className="header-inner">
        <a className="brand-lockup" href="#enemy_form" aria-label="Arknight Calculator">
          <span className="brand-mark">AC</span>
          <span>
            <strong>Arknight Calculator</strong>
            <small>{t('傷害計算工作台')}</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label={t('主要導覽')}>
          <a href="#enemy_form">{t('作戰參數')}</a>
          <a href="#member_table">{t('幹員數據')}</a>
          <a href="#attackSkill_table">{t('技能傷害')}</a>
        </nav>

        <div className="header-actions">
          <button
            className="header-button"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#logOffcanvas"
          >
            {t('計算明細')}
          </button>
          <button className="language-button" type="button" onClick={toggleLanguage}>
            {language === 'zh-TW' ? '简' : '繁'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
