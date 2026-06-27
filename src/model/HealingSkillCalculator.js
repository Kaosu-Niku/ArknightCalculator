import BasicCalculatorModel from './BasicCalculator';
import HealingSkillEffectResolverModel from './HealingSkillEffectResolver';
import HealingSkillEffectRulesModel from './healingSkillEffectRules';
import SkillDataIndexModel from './SkillDataIndex';
import SkillCalculatorModel from './SkillCalculator';
import {
  resolveDamageStreamTotal,
  resolveDpsByStreams,
} from './SkillTotalFormula';

const INCANTATION_MEDIC_HEAL_RATIO = 0.5;

const isMedicSkill = (member) => member?.profession === 'MEDIC';

const isHealingSkill = (member) => (
  isMedicSkill(member)
  || member?.subProfessionId === 'blessing'
);

const isDamageToHealingSkill = (member) => (
  member?.subProfessionId === 'incantationmedic'
);

const hasDamageToHealingEffect = (healingEffects) => (
  healingEffects.fieldResult('healDamageScale').found
);

const createHealingEffects = ({
  skillData,
  checkName,
}) => {
  const rule = HealingSkillEffectRulesModel.createRule(checkName, {
    skillAttribute: (attribute) => (
      SkillDataIndexModel.blackboard(skillData).get(attribute)?.value ?? 0
    ),
    skillDuration: () => skillData.duration,
  });

  return HealingSkillEffectResolverModel.createHealingEffects({
    skillData,
    rule,
  });
};

const resolveHealingInterval = (mainInterval, healingEffects) => {
  const healIntervalResult = healingEffects.fieldResult('healInterval');
  if(healIntervalResult.found){
    return healIntervalResult.value;
  }

  const healIntervalScaleResult = healingEffects.fieldResult('healIntervalScale');
  const healIntervalAddResult = healingEffects.fieldResult('healIntervalAdd');
  const scaledInterval = healIntervalScaleResult.found
    ? mainInterval * healIntervalScaleResult.value
    : mainInterval;

  return healIntervalAddResult.found
    ? scaledInterval + healIntervalAddResult.value
    : scaledInterval;
};

const createHealingStreams = (damageReport, healingEffects) => {
  const healDamageScaleResult = healingEffects.fieldResult('healDamageScale');
  if(healDamageScaleResult.found){
    return damageReport.streams.map(stream => ({
      ...stream,
      healing: stream.damage * healDamageScaleResult.value,
      damage: stream.damage * healDamageScaleResult.value,
    }));
  }

  const mainStream = damageReport.streams.find(stream => stream.source === 'main');
  const healScaleResult = healingEffects.fieldResult('healScale');
  const healScale = healScaleResult.found ? healScaleResult.value : 1;
  const healTimesResult = healingEffects.fieldResult('healTimes');
  const healDurationResult = healingEffects.fieldResult('healDuration');
  const interval = resolveHealingInterval(
    mainStream?.interval ?? damageReport.schedule.attackInterval,
    healingEffects
  );
  const healMaxHpRatioResult = healingEffects.fieldResult('healMaxHpRatio');
  const baseHealing = healMaxHpRatioResult.found
    ? (damageReport.memberNumeric.maxHp * healMaxHpRatioResult.value)
    : ((mainStream?.details?.attackPower ?? 0) * healScale);
  const healPerAction = baseHealing + healingEffects.healFlat();

  return [{
    source: 'main',
    healing: healPerAction,
    damage: healPerAction,
    details: mainStream?.details,
    times: healTimesResult.found ? healTimesResult.value : mainStream?.times,
    interval,
    duration: healDurationResult.found ? healDurationResult.value : mainStream?.duration,
    hitMultiplier: mainStream?.hitMultiplier,
  }];
};

const HealingSkillCalculatorModel = {
  isHealingSkill,

  shouldShowInDamageTable: ({
    member,
    checkName,
    damageMetrics,
  }) => {
    if(isHealingSkill(member) && !isDamageToHealingSkill(member)){
      return false;
    }

    if(HealingSkillEffectRulesModel.isPureHealingRule(checkName)){
      return false;
    }

    return damageMetrics.total > 0;
  },

  buildHealingRows: ({
    skillRows,
    processedCharacterData,
    type,
  }) => {
    return skillRows.filter(row => {
      const member = SkillCalculatorModel.skillFromMember(row, processedCharacterData);
      if(!member){
        return false;
      }

      if(!type){
        return isHealingSkill(member);
      }

      const skillData = SkillCalculatorModel.skillData(type, row);
      return isHealingSkill(member)
        || HealingSkillEffectRulesModel.hasRule(`${member.name}-${skillData.name}`);
    });
  },

  skillMemberReport: (
    type,
    skillRow,
    characterJsonData,
    enemyData,
    subProfessionIdJsonData,
    uniequipJsonData,
    battleEquipJsonData,
    candidates = false
  ) => {
    const member = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const skillData = SkillCalculatorModel.skillData(type, skillRow);
    const checkName = `${member.name}-${skillData.name}`;
    const damageReport = SkillCalculatorModel.skillMemberReport(
      type,
      skillRow,
      characterJsonData,
      enemyData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
      candidates
    );

    if(isDamageToHealingSkill(member)){
      return {
        ...damageReport,
        hps: damageReport.dps * INCANTATION_MEDIC_HEAL_RATIO,
        total: damageReport.total * INCANTATION_MEDIC_HEAL_RATIO,
        healingSource: 'damage',
      };
    }

    const healingEffects = createHealingEffects({
      skillData,
      checkName,
    });
    const streams = createHealingStreams(damageReport, healingEffects);
    const total = streams.reduce((sum, stream) => (
      sum + resolveDamageStreamTotal(stream, damageReport.schedule)
    ), 0);

    return {
      ...damageReport,
      streams,
      hps: resolveDpsByStreams(streams, damageReport.schedule, total),
      total,
      healingSource: hasDamageToHealingEffect(healingEffects) ? 'damage' : 'heal',
    };
  },

  skillMemberMetrics: (...args) => {
    const report = HealingSkillCalculatorModel.skillMemberReport(...args);
    return {
      hps: report.hps,
      total: report.total,
    };
  },

  memberProfessionName: (member, professionJsonData) => (
    BasicCalculatorModel.memberProfession(member, professionJsonData).chineseName
  ),
};

export default HealingSkillCalculatorModel;
