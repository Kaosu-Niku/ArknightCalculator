import BasicCalculatorModel from '../../model/BasicCalculator';
import FilterModel from '../../model/Filter';
import SkillCalculatorModel from '../../model/SkillCalculator';
import SkillCustomCalculatorModel from '../../model/SkillCustomCalculator';
import UniequipCalculatorModel from '../../model/UniequipCalculator';
import { hasConditionalModuleTrait } from '../../model/uniequipTraitRules';
import { resolveSkillAttackType } from '../../model/subProfessionCombatRules';

export const optionalAttackSkillColumns = [
  { id: 'ammo', label: '彈藥數量' },
  { id: 'attackType', label: '技能類型' },
  { id: 'attackMultiplier', label: '攻擊乘算' },
  { id: 'attackScale', label: '攻擊倍率' },
  { id: 'damageScale', label: '傷害倍率' },
  { id: 'defenseReduction', label: '防禦降低' },
  { id: 'defensePenetration', label: '固定防禦穿透' },
  { id: 'resistanceReduction', label: '法術抗性降低' },
  { id: 'attackInterval', label: '攻擊間隔調整' },
  { id: 'attackSpeed', label: '攻擊速度調整' },
  { id: 'attackCount', label: '單次攻擊數' },
  { id: 'attackTimes', label: '攻擊段數' },
  { id: 'durationOverride', label: '持續時間覆寫' },
  { id: 'extraAttackType', label: '額外傷害類型' },
  { id: 'extraAttackScale', label: '額外攻擊倍率' },
  { id: 'extraAttackInterval', label: '額外傷害間隔' },
];

const createAttackSkillColumns = ({
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
  const damageMetricsCache = new WeakMap();

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

  const getFormulaField = (row, fieldName) => {
    const result = getFormulaEffects(row).fieldResult(fieldName);
    return result.found ? result.value : '-';
  };

  const getDamageMetrics = (row) => {
    const cached = damageMetricsCache.get(row);
    if(cached){
      return cached;
    }

    const metrics = SkillCalculatorModel.skillMemberMetrics(
      whichType,
      row,
      processedCharacterData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
      candidates
    );
    damageMetricsCache.set(row, metrics);
    return metrics;
  };

  const optionalColumns = {
    ammo: { title: t('彈藥數量'), data: null, render: function (data, type, row) { return getFormulaField(row, 'ammoCount'); } },
    attackType: { title: t('技能類型'), data: null, render: function (data, type, row) {
      const override = getFormulaField(row, 'attackTypeOverride');
      const member = getMember(row);
      const subProfession = BasicCalculatorModel.memberSubProfessionId(
        member,
        subProfessionIdJsonData
      );
      return t(resolveSkillAttackType({
        subProfessionId: member.subProfessionId,
        baseAttackType: subProfession.attackType,
        skillAttackType: override === '-' ? null : override,
        streamAttackType: null,
      }), 'zh-TW');
    } },
    attackMultiplier: { title: t('攻擊乘算'), data: null, render: function (data, type, row) { return getFormulaField(row, 'attackMultiplier'); } },
    attackScale: { title: t('攻擊倍率'), data: null, render: function (data, type, row) { return getFormulaField(row, 'attackScale'); } },
    damageScale: { title: t('傷害倍率'), data: null, render: function (data, type, row) { return getFormulaField(row, 'damageScale'); } },
    defenseReduction: { title: t('防禦降低'), data: null, render: function (data, type, row) { return getFormulaField(row, 'defenseReduction'); } },
    defensePenetration: { title: t('固定防禦穿透'), data: null, render: function (data, type, row) { return getFormulaField(row, 'defensePenetration'); } },
    resistanceReduction: { title: t('法術抗性降低'), data: null, render: function (data, type, row) { return getFormulaField(row, 'resistanceReduction'); } },
    attackInterval: { title: t('攻擊間隔調整'), data: null, render: function (data, type, row) { return getFormulaField(row, 'attackIntervalRevision'); } },
    attackSpeed: { title: t('攻擊速度調整'), data: null, render: function (data, type, row) { return getFormulaField(row, 'attackSpeedRevision'); } },
    attackCount: { title: t('單次攻擊數'), data: null, render: function (data, type, row) { return getFormulaField(row, 'attackCount'); } },
    attackTimes: { title: t('攻擊段數'), data: null, render: function (data, type, row) { return getFormulaField(row, 'attackTimes'); } },
    durationOverride: { title: t('持續時間覆寫'), data: null, render: function (data, type, row) { return getFormulaField(row, 'durationOverride'); } },
    extraAttackType: { title: t('額外傷害類型'), data: null, render: function (data, type, row) { return getFormulaField(row, 'extraAttackTypeOverride'); } },
    extraAttackScale: { title: t('額外攻擊倍率'), data: null, render: function (data, type, row) { return getFormulaField(row, 'extraAttackScale'); } },
    extraAttackInterval: { title: t('額外傷害間隔'), data: null, render: function (data, type, row) { return getFormulaField(row, 'extraAttackInterval'); } },
  };

  return [
    { title: t("名稱"), data: null, render: function (data, type, row) { return t(getMember(row).name, 'zh-CN'); } },
    { title: t("星級"), data: "rarity", render: function (data, type, row) { return BasicCalculatorModel.memberRarity(getMember(row)); } },
    { title: t("職業"), data: "profession", render: function (data, type, row) { return t(BasicCalculatorModel.memberProfession(getMember(row), professionJsonData).chineseName, 'zh-TW'); } },
    { title: t("分支"), data: "subProfessionId", render: function (data, type, row) { return t(BasicCalculatorModel.memberSubProfessionId(getMember(row), subProfessionIdJsonData).chineseName, 'zh-TW'); } },
    { title: t("模組"), data: "equipid",
      render: function (data, type, row) {
        const member = getMember(row);
        const equipData = UniequipCalculatorModel.memberEquipData(member, uniequipJsonData);
        if(equipData){
          const moduleName = t(equipData.uniEquipName, 'zh-CN');
          const subProfession = BasicCalculatorModel.memberSubProfessionId(
            member,
            subProfessionIdJsonData
          ).chineseName;
          const conditionApplied = candidates
            && hasConditionalModuleTrait(subProfession);

          if(conditionApplied && type === 'display'){
            return `<span class="module-name-with-condition"><span>${moduleName}</span><span class="module-condition-badge">${t('模組條件生效')}</span></span>`;
          }

          return moduleName;
        }
        else{
          return `${t(member.name, 'zh-CN')}${t('证章', 'zh-CN')}`;
        }
      }
    },
    { title: t("技能名稱"), data: null, render: function (data, type, row) {
      const member = getMember(row);
      const stateSuffix = row.skillState
        ? `（${t(row.skillState === 'initial' ? '切換前' : '切換後')}）`
        : '';
      const skillName = `${t(getSkillData(row).name, 'zh-CN')}${stateSuffix}`;
      const checkName = `${member.name}-${getSkillData(row).name}`;
      const conditionApplied = candidates
        && SkillCustomCalculatorModel.hasConditionalEffect(checkName);

      if(conditionApplied && type === 'display'){
        return `<span class="module-name-with-condition"><span>${skillName}</span><span class="module-condition-badge">${t('技能條件生效')}</span></span>`;
      }

      return skillName;
    } },
    { title: t("冷卻時間"), data: null, render: function (data, type, row) { return getSkillData(row).spData.spCost; } },
    { title: t("持續時間"), data: null, render: function (data, type, row) { return getSkillData(row).duration; } },
    ...visibleOptionalColumns.map(columnId => optionalColumns[columnId]).filter(Boolean),
    { title: t("技能DPS"), data: null, render: function (data, type, row) { return FilterModel.numberFilter(getDamageMetrics(row).dps); } },
    { title: t("技能總傷"), data: null, render: function (data, type, row) { return FilterModel.numberFilter(getDamageMetrics(row).total); } },
  ];
};

export default createAttackSkillColumns;
