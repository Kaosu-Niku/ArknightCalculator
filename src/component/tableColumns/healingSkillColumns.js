import BasicCalculatorModel from '../../model/BasicCalculator';
import FilterModel from '../../model/Filter';
import HealingSkillEffectResolverModel from '../../model/HealingSkillEffectResolver';
import HealingSkillCalculatorModel from '../../model/HealingSkillCalculator';
import HealingSkillEffectRulesModel from '../../model/healingSkillEffectRules';
import SkillDataIndexModel from '../../model/SkillDataIndex';
import SkillCalculatorModel from '../../model/SkillCalculator';
import UniequipCalculatorModel from '../../model/UniequipCalculator';

export const optionalHealingSkillColumns = [
  { id: 'healScale', label: '治療倍率' },
  { id: 'healFlat', label: '固定治療' },
  { id: 'healTimes', label: '治療次數' },
  { id: 'healInterval', label: '治療間隔' },
  { id: 'healDuration', label: '治療持續時間' },
  { id: 'healDamageScale', label: '傷害轉治療倍率' },
  { id: 'healMaxHpRatio', label: '最大生命恢復比例' },
  { id: 'attackMultiplier', label: '攻擊乘算' },
  { id: 'attackSpeed', label: '攻擊速度調整' },
  { id: 'attackInterval', label: '攻擊間隔調整' },
  { id: 'ammo', label: '彈藥數量' },
];

const createHealingSkillColumns = ({
  t,
  whichType,
  processedCharacterData,
  enemyData,
  professionJsonData,
  subProfessionIdJsonData,
  uniequipJsonData,
  battleEquipJsonData,
  candidates,
  visibleOptionalColumns = [],
}) => {
  const memberCache = new WeakMap();
  const skillDataCache = new WeakMap();
  const formulaEffectsCache = new WeakMap();
  const healingEffectsCache = new WeakMap();
  const healingMetricsCache = new WeakMap();

  const getMember = (row) => {
    const cached = memberCache.get(row);
    if(cached){
      return cached;
    }

    const member = SkillCalculatorModel.skillFromMember(row, processedCharacterData);
    memberCache.set(row, member);
    return member;
  };

  const getSkillData = (row) => {
    const cached = skillDataCache.get(row);
    if(cached){
      return cached;
    }

    const skillData = SkillCalculatorModel.skillData(whichType, row);
    skillDataCache.set(row, skillData);
    return skillData;
  };

  const getHealingMetrics = (row) => {
    const cached = healingMetricsCache.get(row);
    if(cached){
      return cached;
    }

    const metrics = HealingSkillCalculatorModel.skillMemberMetrics(
      whichType,
      row,
      processedCharacterData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
      candidates
    );
    healingMetricsCache.set(row, metrics);
    return metrics;
  };

  const getFormulaEffects = (row) => {
    const cached = formulaEffectsCache.get(row);
    if(cached){
      return cached;
    }

    const effects = SkillCalculatorModel.skillFormulaEffects(
      whichType,
      row,
      getMember(row),
      uniequipJsonData,
      battleEquipJsonData,
      candidates
    );
    formulaEffectsCache.set(row, effects);
    return effects;
  };

  const getHealingEffects = (row) => {
    const cached = healingEffectsCache.get(row);
    if(cached){
      return cached;
    }

    const skillData = getSkillData(row);
    const checkName = `${getMember(row).name}-${skillData.name}`;
    const rule = HealingSkillEffectRulesModel.createRule(checkName, {
      skillAttribute: (attribute) => (
        SkillDataIndexModel.blackboard(skillData).get(attribute)?.value ?? 0
      ),
      skillDuration: () => skillData.duration,
    });
    const effects = HealingSkillEffectResolverModel.createHealingEffects({
      skillData,
      rule,
    });
    healingEffectsCache.set(row, effects);
    return effects;
  };

  const formulaField = (row, fieldName) => {
    const result = getFormulaEffects(row).fieldResult(fieldName);
    return result.found ? result.value : '-';
  };

  const healingField = (row, fieldName) => {
    const result = getHealingEffects(row).fieldResult(fieldName);
    return result.found ? result.value : '-';
  };

  const optionalColumns = {
    healScale: { title: t('治療倍率'), data: null, render: function (data, type, row) { return healingField(row, 'healScale'); } },
    healFlat: { title: t('固定治療'), data: null, render: function (data, type, row) { return healingField(row, 'healFlat'); } },
    healTimes: { title: t('治療次數'), data: null, render: function (data, type, row) { return healingField(row, 'healTimes'); } },
    healInterval: { title: t('治療間隔'), data: null, render: function (data, type, row) { return healingField(row, 'healInterval'); } },
    healDuration: { title: t('治療持續時間'), data: null, render: function (data, type, row) { return healingField(row, 'healDuration'); } },
    healDamageScale: { title: t('傷害轉治療倍率'), data: null, render: function (data, type, row) { return healingField(row, 'healDamageScale'); } },
    healMaxHpRatio: { title: t('最大生命恢復比例'), data: null, render: function (data, type, row) { return healingField(row, 'healMaxHpRatio'); } },
    attackMultiplier: { title: t('攻擊乘算'), data: null, render: function (data, type, row) { return formulaField(row, 'attackMultiplier'); } },
    attackSpeed: { title: t('攻擊速度調整'), data: null, render: function (data, type, row) { return formulaField(row, 'attackSpeedRevision'); } },
    attackInterval: { title: t('攻擊間隔調整'), data: null, render: function (data, type, row) { return formulaField(row, 'attackIntervalRevision'); } },
    ammo: { title: t('彈藥數量'), data: null, render: function (data, type, row) { return formulaField(row, 'ammoCount'); } },
  };

  return [
    { title: t('名稱'), data: null, render: function (data, type, row) { return t(getMember(row).name, 'zh-CN'); } },
    { title: t('星級'), data: null, render: function (data, type, row) { return BasicCalculatorModel.memberRarity(getMember(row)); } },
    { title: t('職業'), data: null, render: function (data, type, row) { return t(BasicCalculatorModel.memberProfession(getMember(row), professionJsonData).chineseName, 'zh-TW'); } },
    { title: t('分支'), data: null, render: function (data, type, row) { return t(BasicCalculatorModel.memberSubProfessionId(getMember(row), subProfessionIdJsonData).chineseName, 'zh-TW'); } },
    { title: t('模組'), data: 'equipid',
      render: function (data, type, row) {
        const member = getMember(row);
        const equipData = UniequipCalculatorModel.memberEquipData(member, uniequipJsonData);
        return equipData
          ? t(equipData.uniEquipName, 'zh-CN')
          : `${t(member.name, 'zh-CN')}${t('证章', 'zh-CN')}`;
      }
    },
    { title: t('技能名稱'), data: null, render: function (data, type, row) {
      const stateSuffix = row.skillState
        ? `（${t(row.skillState === 'initial' ? '切換前' : '切換後')}）`
        : '';
      return `${t(getSkillData(row).name, 'zh-CN')}${stateSuffix}`;
    } },
    { title: t('冷卻時間'), data: null, render: function (data, type, row) { return getSkillData(row).spData.spCost; } },
    { title: t('持續時間'), data: null, render: function (data, type, row) { return getSkillData(row).duration; } },
    ...visibleOptionalColumns.map(columnId => optionalColumns[columnId]).filter(Boolean),
    { title: t('技能HPS'), data: null, render: function (data, type, row) { return FilterModel.numberFilter(getHealingMetrics(row).hps); } },
    { title: t('技能總治療'), data: null, render: function (data, type, row) { return FilterModel.numberFilter(getHealingMetrics(row).total); } },
  ];
};

export default createHealingSkillColumns;
