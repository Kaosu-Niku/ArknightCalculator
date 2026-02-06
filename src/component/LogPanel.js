import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import LogManager from '../model/LogManager';
import { useLanguage } from '../context/LanguageContext';

const LogPanel = () => {
  const [logs, setLogs] = useState([]);
  const [memberOptions, setMemberOptions] = useState([]);
  const [targetMember, setTargetMember] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    // 初始化时，如果 LogManager 已经有目标干员，设置到状态中
    const initialMember = LogManager.getTargetMember();
    if (initialMember) {
      setTargetMember({ value: initialMember, label: initialMember });
    }

    // 訂閱日誌更新
    const unsubscribe = LogManager.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    // 加載幹員列表用于下拉框
    fetch(`${process.env.PUBLIC_URL}/json/character_table.json`)
      .then(res => res.json())
      .then(data => {
        // data 是 object，key 是 id
        // 提取 name 並去重排序
        const names = Array.from(new Set(Object.values(data).map(m => m.name)))
            .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
        
        // 转换为 react-select 需要的格式 { value: '...', label: '...' }
        const options = names.map(name => ({ value: name, label: name }));
        setMemberOptions(options);
      })
      .catch(err => console.error("Failed to load members for log panel", err));

    return () => unsubscribe();
  }, []);

  const handleMemberChange = (selectedOption) => {
    setTargetMember(selectedOption);
    const val = selectedOption ? selectedOption.value : '';
    LogManager.setTargetMember(val);
  };

  const handleClear = () => {
    LogManager.clearLogs();
  };

  return (
    <>
      {/* 觸發按鈕區域 - 已移至 Header 組件中，此處不再渲染 */}
      
      {/* Offcanvas 面板 */}
      <div className="offcanvas offcanvas-start" data-bs-scroll="true" tabIndex="-1" id="logOffcanvas" aria-labelledby="logOffcanvasLabel" style={{width: '600px', maxWidth: '90vw'}}>
        <div className="offcanvas-header bg-light">
          <h5 className="offcanvas-title" id="logOffcanvasLabel">
            📊 {t('數據計算日誌')}
          </h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        
        <div className="offcanvas-body d-flex flex-column">
          {/* 設置區域 */}
          <div className="card mb-3 border-primary">
            <div className="card-body py-2">
                <label htmlFor="memberSelect" className="form-label fw-bold small text-primary">{t('目標幹員 (僅記錄選中幹員的計算過程)')}</label>
                <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                        <Select
                            id="memberSelect"
                            value={targetMember}
                            onChange={handleMemberChange}
                            options={memberOptions}
                            placeholder={t('請選擇幹員...')}
                            isClearable
                            isSearchable
                            noOptionsMessage={() => t('無匹配幹員')}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    borderColor: '#dee2e6',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        borderColor: '#0d6efd'
                                    }
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                })
                            }}
                        />
                    </div>
                    <button className="btn btn-outline-danger" type="button" onClick={handleClear} title={t('清空日誌')}>
                        🗑️
                    </button>
                </div>
            </div>
          </div>

          {/* 日誌列表 */}
          <div className="flex-grow-1 overflow-auto">
            <div className="accordion" id="logAccordion">
                {logs.length === 0 && (
                    <div className="text-center text-muted mt-5">
                        <p>📭 {t('暫無日誌數據')}</p>
                        <small>{t('請先選擇幹員，然後進行數據計算操作')}</small>
                    </div>
                )}
                
                {logs.map((log, index) => (
                <div className="accordion-item" key={log.id}>
                    <h2 className="accordion-header" id={`heading${index}`}>
                    <button className="accordion-button collapsed py-2" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${index}`} aria-expanded="false" aria-controls={`collapse${index}`}>
                        <small className="text-muted me-2">#{index + 1}</small>
                        <span className="text-truncate" title={log.title}>{log.title}</span>
                    </button>
                    </h2>
                    <div id={`collapse${index}`} className="accordion-collapse collapse" aria-labelledby={`heading${index}`} data-bs-parent="#logAccordion">
                    <div className="accordion-body p-0">
                        <div className="table-responsive">
                            <table className="table table-striped table-hover table-sm mb-0 table-bordered" style={{fontSize: '0.85rem'}}>
                                <thead className="table-light">
                                    <tr>
                                        <th style={{width: '40%'}}>Key</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(log.data || {}).map(([k, v]) => (
                                        <tr key={k}>
                                            <td className="text-break font-monospace text-primary">{k}</td>
                                            <td className="text-break">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogPanel;
