const effectWhenActive = (key, value) => value === 0 ? {} : { [key]: value };

const talentEffectRuleFactories = {
  '骋风': () => ({}),
  '宴': ({ memberTalent }) => ({
    attack_speed: memberTalent('min_attack_speed'),
  }),
  '猎蜂': ({ memberTalent }) => ({
    attack: memberTalent('atk') * memberTalent('max_stack_cnt'),
  }),
  '酸糖': ({ memberTalent }) => ({
    ...effectWhenActive('ensure_damage', memberTalent('atk_scale_2')),
  }),
  '夜烟': ({ memberTalent }) => ({
    magic_resistance: memberTalent('magic_resistance'),
  }),
  '卡达': () => ({}),
  '云迹': ({ memberTalent }) => ({
    ...effectWhenActive('atk_scale', memberTalent('atk_scale')),
  }),
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
};

const TalentEffectRulesModel = {
  resolve: (memberName, context) => {
    return talentEffectRuleFactories[memberName]?.(context);
  },
};

export default TalentEffectRulesModel;
