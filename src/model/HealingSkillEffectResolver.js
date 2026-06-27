import SkillDataIndexModel from './SkillDataIndex';

const healingFieldKeys = {
  healScale: 'HEAL_heal_scale',
  healTimes: 'HEAL_times',
  healInterval: 'HEAL_interval',
  healIntervalAdd: 'HEAL_interval_add',
  healIntervalScale: 'HEAL_interval_scale',
  healDuration: 'HEAL_duration',
  healFlat: 'HEAL_flat',
  healDamageScale: 'HEAL_damage_scale',
  healMaxHpRatio: 'HEAL_max_hp_ratio',
};

const effectResult = (found, value, source) => ({
  found,
  value,
  source,
});

const getBlackboardAttribute = (skillData, attribute, blackboardIndex) => {
  return (blackboardIndex ?? SkillDataIndexModel.blackboard(skillData)).get(attribute);
};

const resolveEffect = ({
  skillData,
  attribute,
  blackboardIndex,
  rule,
}) => {
  const blackboardEntry = getBlackboardAttribute(skillData, attribute, blackboardIndex);
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
};

const HealingSkillEffectResolverModel = {
  healingFieldKeys,

  createHealingEffects: ({
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

      const resolvedEffect = resolveEffect({
        skillData,
        attribute,
        blackboardIndex,
        rule,
      });
      cache.set(attribute, resolvedEffect);
      return resolvedEffect;
    };
    const value = (attribute) => result(attribute).value;
    const field = (fieldName) => value(healingFieldKeys[fieldName]);
    const fieldResult = (fieldName) => result(healingFieldKeys[fieldName]);

    return {
      fieldResult,
      healScale: () => field('healScale'),
      healTimes: () => field('healTimes'),
      healInterval: () => field('healInterval'),
      healIntervalAdd: () => field('healIntervalAdd'),
      healIntervalScale: () => field('healIntervalScale'),
      healDuration: () => field('healDuration'),
      healFlat: () => field('healFlat'),
      healDamageScale: () => field('healDamageScale'),
      healMaxHpRatio: () => field('healMaxHpRatio'),
    };
  },
};

export default HealingSkillEffectResolverModel;
