import React, { useEffect, useRef, useState } from 'react';
import 'datatables.net';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';
import SettingsStorageModel from '../model/SettingsStorage';
import CalculatorDataBuilderModel from '../model/CalculatorDataBuilder';
import createMemberColumns from './tableColumns/memberColumns';
import createAttackSkillColumns, { optionalAttackSkillColumns } from './tableColumns/attackSkillColumns';
import { destroyDataTable, initializeDataTable } from './tableColumns/dataTableConfig';
import { useLanguage } from '../context/LanguageContext';
import CalculationSession from '../model/CalculationSession';

const phaseOptions = [
  '精零1級',
  '精零滿級',
  '精一1級',
  '精一滿級',
  '精二1級',
  '精二滿級',
];

const rarityOptions = [
  ['TIER_1', '一星'],
  ['TIER_2', '二星'],
  ['TIER_3', '三星'],
  ['TIER_4', '四星'],
  ['TIER_5', '五星'],
  ['TIER_6', '六星'],
];

const damageTypes = ['物傷', '法傷', '真傷'];

const NumberField = ({ id, label, value, onChange, min = 0, max, step = 1 }) => (
  <label className="number-field" htmlFor={id}>
    <span>{label}</span>
    <input
      id={id}
      type="number"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      required
    />
  </label>
);

const DamageTypeControl = ({ name, value, onChange, t, required = false }) => (
  <fieldset className="segmented-field">
    <legend>{t('傷害類型')}</legend>
    <div className="segmented-control">
      {damageTypes.map((type, index) => (
        <label key={type} className={value === type ? 'is-active' : ''}>
          <input
            type="radio"
            name={name}
            value={type}
            {...(value === undefined
              ? { defaultChecked: index === 0 }
              : { checked: value === type })}
            onChange={onChange}
            required={required}
          />
          <span>{t(type)}</span>
        </label>
      ))}
    </div>
  </fieldset>
);

const HelpButton = ({ target, label }) => (
  <button
    type="button"
    className="help-button"
    data-bs-toggle="modal"
    data-bs-target={`#${target}`}
    aria-label={label}
    title={label}
  >
    <span aria-hidden="true">i</span>
  </button>
);

const HelpModal = ({ id, title, children, t }) => (
  <div className="modal fade" id={id} tabIndex="-1" aria-labelledby={`${id}Label`} aria-hidden="true">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content help-modal">
        <div className="modal-header">
          <div>
            <span className="section-index">INFO</span>
            <h2 className="modal-title" id={`${id}Label`}>{title}</h2>
          </div>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label={t('關閉')} />
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button type="button" className="action-button primary" data-bs-dismiss="modal">{t('了解')}</button>
        </div>
      </div>
    </div>
  </div>
);

function MainContent() {
  const { t, language } = useLanguage();
  const initialSettings = useRef(SettingsStorageModel.getAll()).current;
  const [whichType, setWhichType] = useState(initialSettings.type);
  const [checkRarity, setCheckRarity] = useState(initialSettings.rarity);
  const [calculatorData, setCalculatorData] = useState(null);
  const [enemyHp, setEnemyHp] = useState(initialSettings.enemyHp);
  const [enemyAttackType, setEnemyAttackType] = useState(initialSettings.enemyAttackType);
  const [enemyAttack, setEnemyAttack] = useState(initialSettings.enemyAttack);
  const [enemyDef, setEnemyDef] = useState(initialSettings.enemyDef);
  const [enemyRes, setEnemyRes] = useState(initialSettings.enemyRes);
  const [enemySpd, setEnemySpd] = useState(initialSettings.enemySpd);
  const [enemySkill, setEnemySkill] = useState([]);
  const [refreshNonce, setRefreshNonce] = useState(false);
  const [candidates, setCandidates] = useState(initialSettings.candidates);
  const [visibleSkillColumns, setVisibleSkillColumns] = useState(
    optionalAttackSkillColumns
      .map(column => column.id)
      .filter(id => initialSettings.visibleSkillColumns.includes(id))
  );

  const enemyData = {
    enemyHp,
    enemyAttackType,
    enemyAttack,
    enemyDef,
    enemyRes,
    enemySpd,
    enemySkill,
  };

  const memberTableRef = useRef(null);
  const attackSkillTableRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    CalculatorDataBuilderModel.loadCalculatorJson(process.env.PUBLIC_URL)
      .then(data => {
        if (!cancelled) {
          setCalculatorData(data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    SettingsStorageModel.update({
      type: whichType,
      rarity: checkRarity,
      enemyHp,
      enemyAttackType,
      enemyAttack,
      enemyDef,
      enemyRes,
      enemySpd,
      candidates,
      visibleSkillColumns,
    });
  }, [
    whichType,
    checkRarity,
    enemyHp,
    enemyAttackType,
    enemyAttack,
    enemyDef,
    enemyRes,
    enemySpd,
    candidates,
    visibleSkillColumns,
  ]);

  useEffect(() => {
    if (!calculatorData) {
      return;
    }

    const {
      professionJsonData,
      subProfessionIdJsonData,
      characterJsonData,
      uniequipJsonData,
      battleEquipJsonData,
      skillJsonData,
    } = calculatorData;
    const processedCharacterData = CalculatorDataBuilderModel.buildCharacterRows({
      type: whichType,
      characterJsonData,
      checkRarity,
      uniequipJsonData,
    });

    initializeDataTable({
      tableRef: memberTableRef,
      data: processedCharacterData,
      columns: createMemberColumns({
        t,
        whichType,
        professionJsonData,
        subProfessionIdJsonData,
        uniequipJsonData,
        battleEquipJsonData,
      }),
      order: [[0, 'asc'], [4, 'asc']],
      t,
    });

    const processedSkillData = CalculatorDataBuilderModel.buildSkillRows({
      type: whichType,
      skillJsonData,
      characterJsonData,
      processedCharacterData,
      checkRarity,
      uniequipJsonData,
    });

    initializeDataTable({
      tableRef: attackSkillTableRef,
      data: processedSkillData,
      columns: createAttackSkillColumns({
        t,
        whichType,
        processedCharacterData,
        enemyData,
        professionJsonData,
        subProfessionIdJsonData,
        uniequipJsonData,
        battleEquipJsonData,
        candidates,
        visibleOptionalColumns: visibleSkillColumns,
      }),
      order: [[0, 'asc'], [4, 'asc']],
      t,
    });

    CalculationSession.setCalculationContext({
      type: whichType,
      enemyData,
      candidates,
      calculatorData,
    });

    return () => {
      destroyDataTable(memberTableRef);
      destroyDataTable(attackSkillTableRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatorData, whichType, checkRarity, refreshNonce, candidates, language, t, visibleSkillColumns]);

  const addEnemySkill = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = {
      enemySkillType: form.elements.enemySkillType.value,
      enemySkillDamage: form.elements.enemySkillDamage.value,
      enemySkillCount: form.elements.enemySkillCount.value,
      enemySkillWaitTime: form.elements.enemySkillWaitTime.value,
    };
    setEnemySkill(previous => [...previous, formData]);
    form.reset();
  };

  const toggleSkillColumn = (columnId) => {
    setVisibleSkillColumns(columns => {
      const selectedColumns = new Set(columns);

      if (selectedColumns.has(columnId)) {
        selectedColumns.delete(columnId);
      } else {
        selectedColumns.add(columnId);
      }

      return optionalAttackSkillColumns
        .map(column => column.id)
        .filter(id => selectedColumns.has(id));
    });
  };

  return (
    <main className="calculator-main">
      <section className="workspace-section enemy-workspace" id="enemy_form">
        <div className="section-heading">
          <div>
            <span className="section-index">01</span>
            <h1>{t('作戰參數')}</h1>
          </div>
          <span className={`data-status ${calculatorData ? 'is-ready' : ''}`}>
            {calculatorData ? t('資料已載入') : t('載入資料中')}
          </span>
        </div>

        <div className="enemy-grid">
          <div className="enemy-stat-panel">
            <div className="subsection-heading">
              <div className="subsection-title">
                <h2>{t('敵方基礎數值')}</h2>
              </div>
            </div>
            <div className="field-grid">
              <NumberField id="enemyHp" label={t('生命')} value={enemyHp} onChange={event => setEnemyHp(event.target.value)} />
              <NumberField id="enemyAttack" label={t('攻擊')} value={enemyAttack} onChange={event => setEnemyAttack(event.target.value)} />
              <NumberField id="enemyDef" label={t('防禦')} value={enemyDef} onChange={event => setEnemyDef(event.target.value)} />
              <NumberField id="enemyRes" label={t('法抗')} value={enemyRes} onChange={event => setEnemyRes(event.target.value)} max={100} />
              <NumberField id="enemySpd" label={t('攻擊間隔')} value={enemySpd} onChange={event => setEnemySpd(event.target.value)} min={0.01} step={0.01} />
            </div>
            <DamageTypeControl
              name="enemyAttackType"
              value={enemyAttackType}
              onChange={event => setEnemyAttackType(event.target.value)}
              t={t}
            />
          </div>

          <div className="enemy-skill-panel">
            <div className="subsection-heading">
              <div className="subsection-title">
                <h2>{t('敵方技能')}</h2>
                <HelpButton target="enemySkillHelp" label={t('敵方技能計算說明')} />
              </div>
              <span>{enemySkill.length}</span>
            </div>
            <form className="enemy-skill-form" onSubmit={addEnemySkill}>
              <label>
                <span>{t('單次傷害')}</span>
                <input type="number" name="enemySkillDamage" min="0" required />
              </label>
              <label>
                <span>{t('傷害次數')}</span>
                <input type="number" name="enemySkillCount" min="1" required />
              </label>
              <label>
                <span>{t('等待時間')}</span>
                <input type="number" name="enemySkillWaitTime" min="1" step="0.01" required />
              </label>
              <DamageTypeControl name="enemySkillType" value={undefined} onChange={() => {}} t={t} required />
              <button className="action-button danger" type="submit">{t('新增技能')}</button>
            </form>

            <div className="enemy-skill-list" aria-live="polite">
              {enemySkill.length === 0 && <p className="empty-state">{t('尚未加入敵方技能')}</p>}
              {enemySkill.map((skill, index) => (
                <article className="enemy-skill-item" key={`${skill.enemySkillType}-${index}`}>
                  <div>
                    <strong>{`${t('技能')} ${index + 1}`}</strong>
                    <span>{`${t(skill.enemySkillType)} · ${skill.enemySkillDamage} × ${skill.enemySkillCount}`}</span>
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    aria-label={t('移除技能')}
                    title={t('移除技能')}
                    onClick={() => setEnemySkill(items => items.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-section configuration-workspace" id="configuration">
        <div className="section-heading">
          <div>
            <span className="section-index">02</span>
            <h2>{t('計算設定')}</h2>
          </div>
          <button className="action-button primary" type="button" onClick={() => setRefreshNonce(value => !value)}>
            {t('重新計算')}
          </button>
        </div>

        <div className="setting-group">
          <span className="setting-label">{t('養成階段')}</span>
          <div className="phase-selector" role="group" aria-label={t('養成階段')}>
            {phaseOptions.map(phase => (
              <button
                key={phase}
                type="button"
                className={whichType === phase ? 'is-active' : ''}
                aria-pressed={whichType === phase}
                onClick={() => setWhichType(phase)}
              >
                {t(phase)}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <fieldset className="rarity-selector">
            <legend>{t('稀有度')}</legend>
            {rarityOptions.map(([tier, label]) => (
              <label key={tier} className={checkRarity[tier] ? 'is-active' : ''}>
                <input
                  type="checkbox"
                  checked={checkRarity[tier]}
                  onChange={event => setCheckRarity(previous => ({
                    ...previous,
                    [tier]: event.target.checked,
                  }))}
                />
                <span>{t(label)}</span>
              </label>
            ))}
          </fieldset>

          <div className="condition-setting">
            <label className="condition-toggle">
              <input type="checkbox" checked={candidates} onChange={event => setCandidates(event.target.checked)} />
              <span className="toggle-track" aria-hidden="true"><span /></span>
              <span>
                <strong>{t('條件與機率效果')}</strong>
                <small>{candidates ? t('已啟用') : t('未啟用')}</small>
              </span>
            </label>
            <HelpButton target="conditionHelp" label={t('條件與機率效果說明')} />
          </div>
        </div>
      </section>

      <section className="data-section" id="member_table">
        <div className="section-heading table-heading">
          <div>
            <span className="section-index">03</span>
            <h2>{t('幹員數據')}</h2>
          </div>
        </div>
        <div className="table-shell">
          <table ref={memberTableRef} className="display calculator-table" />
        </div>
      </section>

      <section className="data-section" id="attackSkill_table">
        <div className="section-heading table-heading">
          <div>
            <span className="section-index">04</span>
            <h2>{t('技能傷害')}</h2>
          </div>
          <div className="table-heading-actions">
            <span className={`condition-status ${candidates ? 'is-active' : ''}`}>
              {candidates ? t('條件與期望值已計入') : t('未計入條件效果')}
            </span>
            <div className="dropdown column-picker">
              <button
                className="column-picker-button dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false"
              >
                {t('欄位')}
                <span>{`${visibleSkillColumns.length}/${optionalAttackSkillColumns.length}`}</span>
              </button>
              <div className="dropdown-menu dropdown-menu-end column-picker-menu">
                <div className="column-picker-header">
                  <strong>{t('顯示特殊欄位')}</strong>
                  <span>{t('只顯示已勾選項目')}</span>
                </div>
                <div className="column-picker-options">
                  {optionalAttackSkillColumns.map(column => (
                    <label key={column.id}>
                      <input
                        type="checkbox"
                        checked={visibleSkillColumns.includes(column.id)}
                        onChange={() => toggleSkillColumn(column.id)}
                      />
                      <span>{t(column.label)}</span>
                    </label>
                  ))}
                </div>
                <div className="column-picker-footer">
                  <button
                    type="button"
                    onClick={() => setVisibleSkillColumns(optionalAttackSkillColumns.map(column => column.id))}
                  >
                    {t('全部顯示')}
                  </button>
                  <button type="button" onClick={() => setVisibleSkillColumns([])}>{t('全部隱藏')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="table-shell">
          <table ref={attackSkillTableRef} className="display calculator-table" />
        </div>
      </section>

      <HelpModal id="enemySkillHelp" title={t('敵方技能如何計算')} t={t}>
        <p className="help-intro">
          {t('敵方技能會換算成平均每秒傷害，並與敵人的普通攻擊傷害相加。')}
        </p>
        <dl className="help-definition-list">
          <div>
            <dt>{t('單次傷害')}</dt>
            <dd>{t('技能每一段的原始傷害；物理與法術傷害會套用幹員防禦或法抗，真實傷害則直接計入。')}</dd>
          </div>
          <div>
            <dt>{t('傷害次數')}</dt>
            <dd>{t('一次技能施放會造成幾段傷害。')}</dd>
          </div>
          <div>
            <dt>{t('等待時間')}</dt>
            <dd>{t('兩次技能施放之間的平均秒數，可視為技能週期。')}</dd>
          </div>
        </dl>
        <div className="formula-note">
          <span>{t('技能 DPS')}</span>
          <strong>{t('減傷後單次傷害 × 傷害次數 ÷ 等待時間')}</strong>
        </div>
        <p className="help-footnote">
          {t('加入多個敵方技能時，各技能的平均 DPS 會分別計算後相加。')}
        </p>
      </HelpModal>

      <HelpModal id="conditionHelp" title={t('條件與機率效果如何計算')} t={t}>
        <p className="help-intro">
          {t('此開關統一控制技能、天賦與模組中需要條件或機率才能生效的附加效果。')}
        </p>
        <ul className="help-list">
          <li>{t('可能影響攻擊力、攻擊倍率、傷害倍率與攻擊速度等數值。')}</li>
          <li>{t('關閉時，所有已收錄的條件與機率效果都視為未觸發。')}</li>
          <li>{t('開啟時，只要條件成立就必定生效的效果會完整計入。')}</li>
          <li>{t('帶有觸發機率的效果會按期望值計算，例如20%機率視為每5次觸發1次。')}</li>
          <li>{t('不會自行判斷血量、阻擋數、敵人狀態或其他戰場條件。')}</li>
          <li>{t('只有已建立對應 custom 或條件規則的效果會隨此開關變化。')}</li>
          <li>{t('技能表格的模組欄位會標記目前已計入該模組的條件或機率期望值。')}</li>
        </ul>
        <div className="help-examples">
          <strong>{t('常見例子')}</strong>
          <ul>
            <li>{t('生命高於指定比例時提升攻擊：開啟後視為生命條件已滿足並完整計入。')}</li>
            <li>{t('攻擊特定重量或狀態的敵人時增傷：開啟後視為目標條件成立。')}</li>
            <li>{t('20%機率使攻擊倍率提升至160%：開啟後採用112%的期望倍率。')}</li>
          </ul>
        </div>
        <div className="help-comparison">
          <div>
            <span>{t('未啟用')}</span>
            <strong>{t('只計入常駐與必定效果')}</strong>
          </div>
          <div>
            <span>{t('已啟用')}</span>
            <strong>{t('條件成立，機率效果採期望值')}</strong>
          </div>
        </div>
      </HelpModal>
    </main>
  );
}

export default MainContent;
