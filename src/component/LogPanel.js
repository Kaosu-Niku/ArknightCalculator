import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import CalculationReportModel from '../model/CalculationReport';
import CalculationSession from '../model/CalculationSession';
import { useLanguage } from '../context/LanguageContext';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderRadius: 4,
    borderColor: state.isFocused ? '#008f91' : '#aeb7bf',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 143, 145, 0.13)' : 'none',
    '&:hover': { borderColor: '#008f91' },
  }),
  menu: base => ({ ...base, zIndex: 9999 }),
};

const statLabels = {
  maxHp: '生命',
  atk: '攻擊',
  def: '防禦',
  magicResistance: '法抗',
  baseAttackTime: '攻擊間隔',
  attackSpeed: '攻速',
};

const effectLabels = {
  attackTypeOverride: '傷害類型轉換',
  attackMultiplier: '攻擊乘算',
  attackScale: '攻擊倍率',
  damageScale: '傷害倍率',
  defenseReduction: '敵方防禦降低',
  defensePenetration: '固定防禦穿透',
  resistanceReduction: '敵方法抗降低',
  attackIntervalRevision: '攻擊間隔調整',
  attackSpeedRevision: '攻擊速度調整',
  attackCount: '單次攻擊數',
  durationOverride: '持續時間覆寫',
  attackTimes: '攻擊段數',
  ammoCount: '彈藥數量',
  extraAttackTypeOverride: '額外傷害類型',
  extraAttackScale: '額外攻擊倍率',
  extraAttackInterval: '額外傷害間隔',
};

const streamLabels = {
  main: '主要傷害',
  skillExtra: '技能額外傷害',
  traitExtra: '分支／模組額外傷害',
};

const formatNumber = (value) => {
  if(typeof value !== 'number'){
    return value === undefined || value === null || value === '' ? '-' : String(value);
  }
  if(!Number.isFinite(value)){
    return String(value);
  }
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
};

const ValueRows = ({ values, labels = {}, t }) => (
  <dl className="report-value-list">
    {Object.entries(values).map(([key, value]) => (
      <div key={key}>
        <dt>{t(labels[key] ?? key)}</dt>
        <dd>{formatNumber(value)}</dd>
      </div>
    ))}
  </dl>
);

const NumericBreakdown = ({ breakdown, t }) => (
  <div className="report-table-wrap">
    <table className="report-table numeric-breakdown-table">
      <thead>
        <tr>
          <th>{t('數值')}</th>
          <th>{t('面板')}</th>
          <th>{t('潛能')}</th>
          <th>{t('信賴')}</th>
          <th>{t('模組')}</th>
          <th>{t('天賦')}</th>
          <th>{t('最終')}</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(statLabels).map(key => (
          <tr key={key}>
            <th>{t(statLabels[key])}</th>
            <td>{formatNumber(breakdown.base[key])}</td>
            <td>{formatNumber(breakdown.potential[key])}</td>
            <td>{formatNumber(breakdown.trust[key])}</td>
            <td>{formatNumber(breakdown.module[key])}</td>
            <td>{formatNumber(breakdown.talent[key])}</td>
            <td><strong>{formatNumber(breakdown.final[key])}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FormulaEffects = ({ effects, t }) => (
  <div className="effect-grid">
    {Object.entries(effects).map(([key, result]) => (
      <div key={key} className={result.found ? 'is-present' : ''}>
        <span>{t(effectLabels[key] ?? key)}</span>
        <strong>{result.found ? formatNumber(result.value) : t('未提供')}</strong>
        <small>{t(result.source)}</small>
      </div>
    ))}
  </div>
);

const DamageStream = ({ stream, t }) => {
  const details = stream.details;
  return (
    <section className="damage-stream">
      <div className="damage-stream-heading">
        <strong>{t(streamLabels[stream.source] ?? stream.source)}</strong>
        <span>{formatNumber(stream.total)}</span>
      </div>
      <ValueRows t={t} labels={{
        attackType: '最終傷害類型',
        baseAttack: '最終基礎攻擊力',
        attackPower: '本段攻擊力',
        enemyDefense: '結算敵方防禦',
        enemyResistance: '結算敵方法抗',
        damage: '單次傷害',
      }} values={{
        attackType: details.attackType,
        baseAttack: details.baseAttack,
        attackPower: details.attackPower,
        enemyDefense: details.enemyDefense,
        enemyResistance: details.enemyResistance,
        damage: details.damage,
      }} />
      <div className="stream-factor-grid">
        <div className="stream-factor-group">
          <strong>{t('攻擊乘算')}</strong>
          <ValueRows t={t} labels={{ skill: '技能', talent: '天賦', module: '模組', final: '合計' }} values={details.attackMultiplier} />
        </div>
        <div className="stream-factor-group">
          <strong>{t('攻擊倍率')}</strong>
          <ValueRows t={t} labels={{ skill: '技能', talent: '天賦', module: '模組', extra: '額外段', final: '合計' }} values={details.attackScale} />
        </div>
        <div className="stream-factor-group">
          <strong>{t('傷害倍率')}</strong>
          <ValueRows t={t} labels={{ skill: '技能', talent: '天賦', module: '模組', final: '合計' }} values={details.damageMultiplier} />
        </div>
        <div className="stream-factor-group">
          <strong>{t('防禦處理')}</strong>
          <ValueRows t={t} labels={{ skillReduction: '技能降低', talentReduction: '天賦降低', skillPenetration: '技能穿透', modulePenetration: '模組穿透' }} values={details.defenseEffects} />
        </div>
        <div className="stream-factor-group">
          <strong>{t('法抗處理')}</strong>
          <ValueRows t={t} labels={{ skillReduction: '技能降低', talentReduction: '天賦降低', moduleAdjustment: '模組調整' }} values={details.resistanceEffects} />
        </div>
      </div>
    </section>
  );
};

const SkillReport = ({ skillReport, index, t }) => (
  <div className="accordion-item">
    <h3 className="accordion-header" id={`reportSkillHeading${index}`}>
      <button
        className="accordion-button collapsed"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target={`#reportSkill${index}`}
        aria-expanded="false"
        aria-controls={`reportSkill${index}`}
      >
        <span>{String(index + 1).padStart(2, '0')}</span>
        <strong>{t(skillReport.skill.name, 'zh-CN')}</strong>
        <b>{formatNumber(skillReport.total)}</b>
      </button>
    </h3>
    <div id={`reportSkill${index}`} className="accordion-collapse collapse" aria-labelledby={`reportSkillHeading${index}`}>
      <div className="accordion-body skill-report-body">
        <section className="report-section">
          <h4>{t('攻擊排程')}</h4>
          <ValueRows t={t} labels={{
            attackCount: '單次攻擊數',
            attackInterval: '最終攻擊間隔',
            duration: '技能持續時間',
            times: '攻擊段數',
            ammoCount: '彈藥數量',
          }} values={skillReport.schedule} />
        </section>
        <section className="report-section">
          <h4>{t('技能特殊參數')}</h4>
          <FormulaEffects effects={skillReport.formulaEffects} t={t} />
        </section>
        <section className="report-section">
          <h4>{t('原始技能參數')}</h4>
          <ValueRows values={skillReport.skillBlackboard} t={t} />
        </section>
        <section className="report-section">
          <h4>{t('傷害流')}</h4>
          <div className="damage-stream-list">
            {skillReport.streams.map(stream => <DamageStream key={stream.source} stream={stream} t={t} />)}
          </div>
        </section>
      </div>
    </div>
  </div>
);

function LogPanel() {
  const [calculationContext, setCalculationContext] = useState(CalculationSession.getCalculationContext());
  const initialMember = CalculationSession.getTargetMember();
  const [targetMemberName, setTargetMemberName] = useState(initialMember);
  const [activeVariantId, setActiveVariantId] = useState('base');
  const { t } = useLanguage();

  useEffect(() => CalculationSession.subscribeCalculationContext(setCalculationContext), []);

  const memberOptions = useMemo(() => {
    const characters = calculationContext?.calculatorData?.characterJsonData;
    if(!characters){
      return [];
    }
    const names = Array.from(new Set(Object.values(characters)
      .filter(member => member.profession !== 'TOKEN' && member.profession !== 'TRAP')
      .map(member => member.name)))
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    return names.map(name => ({ value: name, label: t(name, 'zh-CN') }));
  }, [calculationContext, t]);

  const targetMember = useMemo(() => {
    if(!targetMemberName){
      return null;
    }
    return memberOptions.find(option => option.value === targetMemberName)
      ?? { value: targetMemberName, label: t(targetMemberName, 'zh-CN') };
  }, [memberOptions, targetMemberName, t]);

  const report = useMemo(() => CalculationReportModel.create({
    memberName: targetMemberName,
    ...(calculationContext ?? {}),
  }), [targetMemberName, calculationContext]);
  const activeVariant = report?.variants.find(variant => variant.id === activeVariantId)
    ?? report?.variants[0];

  const handleMemberChange = (option) => {
    setTargetMemberName(option?.value ?? '');
    setActiveVariantId('base');
    CalculationSession.setTargetMember(option?.value ?? '');
  };

  return (
    <div className="offcanvas offcanvas-start log-panel" data-bs-scroll="true" tabIndex="-1" id="logOffcanvas" aria-labelledby="logOffcanvasLabel">
      <div className="offcanvas-header">
        <div>
          <span className="section-index">TRACE</span>
          <h2 className="offcanvas-title" id="logOffcanvasLabel">{t('計算明細')}</h2>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label={t('關閉')} />
      </div>

      <div className="offcanvas-body">
        <div className="log-toolbar">
          <label htmlFor="memberSelect">{t('檢視幹員')}</label>
          <Select
            inputId="memberSelect"
            value={targetMember}
            onChange={handleMemberChange}
            options={memberOptions}
            placeholder={t('搜尋並選擇幹員')}
            isClearable
            isSearchable
            noOptionsMessage={() => t('沒有符合的幹員')}
            styles={selectStyles}
          />
        </div>

        {!report || !activeVariant ? (
          <div className="log-empty">
            <strong>{t('選擇一名幹員以建立計算報告')}</strong>
            <span>{t('報告會沿用目前的養成階段、敵方數值與模組條件設定。')}</span>
          </div>
        ) : (
          <div className="calculation-report">
            <header className="report-summary">
              <div>
                <span>{report.member.rarity}★ · {t(report.member.profession)} · {t(report.member.subProfession)}</span>
                <h3>{t(report.member.name, 'zh-CN')}</h3>
              </div>
              <dl>
                <div><dt>{t('階段')}</dt><dd>{t(report.type)}</dd></div>
                <div><dt>{t('敵方防禦')}</dt><dd>{formatNumber(report.enemy.defense)}</dd></div>
                <div><dt>{t('敵方法抗')}</dt><dd>{formatNumber(report.enemy.resistance)}</dd></div>
                <div><dt>{t('模組條件')}</dt><dd>{report.candidates ? t('啟用') : t('停用')}</dd></div>
              </dl>
            </header>

            {report.variants.length > 1 && (
              <label className="report-variant-select">
                <span>{t('模組版本')}</span>
                <select value={activeVariant.id} onChange={event => setActiveVariantId(event.target.value)}>
                  {report.variants.map(variant => (
                    <option key={variant.id} value={variant.id}>{t(variant.moduleName, 'zh-CN')}</option>
                  ))}
                </select>
              </label>
            )}

            <section className="report-block">
              <div className="report-block-heading">
                <span>01</span><h3>{t('基礎數值拆解')}</h3>
              </div>
              <NumericBreakdown breakdown={activeVariant.numeric} t={t} />
            </section>

            <section className="report-block">
              <div className="report-block-heading">
                <span>02</span><h3>{t('生效天賦參數')}</h3>
              </div>
              <ValueRows values={activeVariant.talents} t={t} />
            </section>

            <section className="report-block">
              <div className="report-block-heading">
                <span>03</span><h3>{t('技能總傷明細')}</h3>
              </div>
              <div className="accordion log-accordion" id="skillReportAccordion">
                {activeVariant.skills.map((skill, index) => (
                  <SkillReport key={`${skill.skill.name}-${index}`} skillReport={skill} index={index} t={t} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default LogPanel;
