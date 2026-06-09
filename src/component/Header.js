

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import LogManager from '../model/LogManager';

function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    // 訂閱日誌更新以顯示計數
    const unsubscribe = LogManager.subscribe((newLogs) => {
      setLogCount(newLogs.length);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className='bg-dark text-white sticky-top' style={{zIndex: 1020}}>
      <div className='d-flex justify-content-center align-items-center p-1 m-0 position-relative'>
        <h2 className='text-center m-0'>Arknight Calculator</h2>
        <div className="position-absolute end-0 me-2 d-flex gap-2 align-items-center">
          {/* 日誌面板觸發按鈕 */}
          <button 
            className="btn btn-outline-info btn-sm" 
            type="button" 
            data-bs-toggle="offcanvas" 
            data-bs-target="#logOffcanvas"
            title={t('點擊展開日誌面板')}
          >
            {t('查看計算日誌')} 
            {logCount > 0 && <span className="badge bg-danger ms-1">{logCount}</span>}
          </button>

          <button 
            className="btn btn-outline-light btn-sm" 
            onClick={toggleLanguage}
          >
            {language === 'zh-TW' ? '切换至简体中文' : '切换至繁体中文'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;
