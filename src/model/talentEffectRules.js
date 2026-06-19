const effectWhenActive = (key, value) => value === 0 ? {} : { [key]: value };
const maxStackAttack = ({ conditionEffectsEnabled, rawTalent }) => (
  conditionEffectsEnabled
    ? { attack: rawTalent('atk') * rawTalent('max_stack_cnt') }
    : {}
);

const expectedAttackBonus = (probabilityAttribute = 'prob') => (
  ({ conditionalAdditive }) => ({
    attack: conditionalAdditive('atk', probabilityAttribute),
  })
);

const expectedAttackScale = ({ conditionalMultiplier }) => ({
  atk_scale: conditionalMultiplier('atk_scale'),
});

const talentEffectRuleFactories = {
  '骋风': () => ({}),
  '宴': ({ conditionEffectsEnabled, memberTalent }) => (
    conditionEffectsEnabled
      ? { attack_speed: memberTalent('min_attack_speed') }
      : {}
  ),
  '猎蜂': maxStackAttack,
  '莱恩哈特': maxStackAttack,
  '莱伊': maxStackAttack,
  '夕': maxStackAttack,
  '妮芙': maxStackAttack,
  '令': maxStackAttack,
  '琳琅诗怀雅': maxStackAttack,
  '多萝西': maxStackAttack,
  '塞雷娅': maxStackAttack,
  '酸糖': ({ conditionEffectsEnabled, memberTalent }) => ({
    ...effectWhenActive(
      'ensure_damage',
      memberTalent(conditionEffectsEnabled ? 'atk_scale_2' : 'atk_scale')
    ),
  }),
  '夜烟': ({ memberTalent }) => ({
    magic_resistance: memberTalent('magic_resistance'),
  }),
  '卡达': () => ({}),
  '云迹': ({ conditionEffectsEnabled, memberTalent }) => (
    conditionEffectsEnabled
      ? effectWhenActive('atk_scale', memberTalent('atk_scale'))
      : {}
  ),
  '红豆': expectedAttackBonus('prob2'),
  '陨星': expectedAttackBonus(),
  '月见夜': expectedAttackScale,
  'Stormeye': expectedAttackScale,
  '风笛': expectedAttackScale,
  '山': expectedAttackScale,
  '锏': expectedAttackScale,
  '黑': expectedAttackScale,
};

export const talentExcludedAttributes = {
  '红豆': new Set(['atk']),
  '清道夫': new Set(['atk', 'def']),
  '讯使': new Set(['def']),
  '猎蜂': new Set(['atk']),
  '杜宾': new Set(['atk']),
  '铅踝': new Set(['atk']),
  '远山': new Set(['max_hp', 'atk', 'attack_speed']),
  '泡泡': new Set(['atk']),
  '嘉维尔': new Set(['atk', 'def']),
  '莱恩哈特': new Set(['atk']),
  '莱伊': new Set(['atk']),
  '夕': new Set(['atk']),
  '妮芙': new Set(['atk']),
  '令': new Set(['atk']),
  '琳琅诗怀雅': new Set(['atk']),
  '多萝西': new Set(['atk']),
  '塞雷娅': new Set(['atk']),
  '火龙S黑角': new Set(['atk']),
  '山': new Set(['atk']),
  '焰影苇草': new Set(['atk']),
  '死芒': new Set(['max_hp', 'atk', 'def']),
  '电弧': new Set(['max_hp', 'atk', 'def']),
  'Mon3tr': new Set(['atk']),
  '乌尔比安': new Set(['max_hp', 'atk']),
  '陨星': new Set(['atk']),
};

const TalentEffectRulesModel = {
  resolve: (memberName, context) => {
    return talentEffectRuleFactories[memberName]?.(context);
  },
};

export default TalentEffectRulesModel;
