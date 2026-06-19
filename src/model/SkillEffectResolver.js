import SkillDataIndexModel from './SkillDataIndex';

const formulaFieldKeys = {
  attackTypeOverride: 'CHANGE_attackType',
  attackMultiplier: 'atk',
  attackScale: 'atk_scale',
  damageScale: 'damage_scale',
  defenseReduction: 'def',
  defensePenetration: 'def_penetrate_fixed',
  resistanceReduction: 'magic_resistance',
  attackIntervalRevision: 'base_attack_time',
  attackSpeedRevision: 'attack_speed',
  attackCount: 'ATTACK_COUNT',
  durationOverride: 'CHANGE_duration',
  attackTimes: 'times',
  ammoCount: 'attack@trigger_time',
  extraAttackTypeOverride: 'CHANGE_OTHER_attackType',
  extraAttackScale: 'OTHER_atk_scale',
  extraAttackInterval: 'OTHER_base_attack_time',
};

const getBlackboardAttribute = (skillData, attribute, blackboardIndex) => {
  return (blackboardIndex ?? SkillDataIndexModel.blackboard(skillData)).get(attribute);
};

const effectResult = (found, value, source) => ({
  found,
  value,
  source,
});

const SkillEffectResolverModel = {
  formulaFieldKeys,

  resolveEffect: ({
    skillData,
    attribute,
    blackboardIndex,
    rule,
  }) => {
    const blackboardEntry = getBlackboardAttribute(
      skillData,
      attribute,
      blackboardIndex
    );
    const hasCustomEffect = Object.prototype.hasOwnProperty.call(rule.effects, attribute);

    if(blackboardEntry === undefined){
      if(hasCustomEffect){
        return effectResult(true, rule.effects[attribute] ?? 0, 'custom');
      }

      return effectResult(false, 0, 'missing');
    }

    if(rule.ignoredAttributes.has(attribute)){
      if(hasCustomEffect){
        return effectResult(true, rule.effects[attribute] ?? 0, 'custom');
      }

      return effectResult(false, 0, 'excluded');
    }

    return effectResult(true, blackboardEntry.value ?? 0, 'blackboard');
  },

  createSkillEffects: ({
    skillData,
    blackboardIndex: providedBlackboardIndex,
    rule,
  }) => {
    const cache = new Map();
    const blackboardIndex = providedBlackboardIndex
      ?? SkillDataIndexModel.blackboard(skillData);
    const result = (attribute) => {
      if(cache.has(attribute)){
        return cache.get(attribute);
      }

      const resolvedEffect = SkillEffectResolverModel.resolveEffect({
        skillData,
        attribute,
        blackboardIndex,
        rule,
      });
      cache.set(attribute, resolvedEffect);
      return resolvedEffect;
    };

    const value = (attribute) => result(attribute).value;
    const field = (fieldName) => value(formulaFieldKeys[fieldName]);
    const fieldResult = (fieldName) => result(formulaFieldKeys[fieldName]);

    return {
      fieldResult,
      attackTypeOverride: () => field('attackTypeOverride'),
      attackMultiplier: () => field('attackMultiplier'),
      attackScale: () => field('attackScale'),
      damageScale: () => field('damageScale'),
      defenseReduction: () => field('defenseReduction'),
      defensePenetration: () => field('defensePenetration'),
      resistanceReduction: () => field('resistanceReduction'),
      attackIntervalRevision: () => field('attackIntervalRevision'),
      attackSpeedRevision: () => field('attackSpeedRevision'),
      attackCount: () => field('attackCount'),
      durationOverride: () => field('durationOverride'),
      attackTimes: () => field('attackTimes'),
      ammoCount: () => field('ammoCount'),
      extraAttackTypeOverride: () => field('extraAttackTypeOverride'),
      extraAttackScale: () => field('extraAttackScale'),
      extraAttackInterval: () => field('extraAttackInterval'),
    };
  },
};

export default SkillEffectResolverModel;
