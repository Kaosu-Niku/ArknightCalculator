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

const activeRawEffect = (effectKey, rawKey = effectKey) => (
  ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled ? { [effectKey]: rawTalent(rawKey) } : {}
  )
);

const activeStackedEffect = (effectKey, rawKey = effectKey) => (
  ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? { [effectKey]: rawTalent(rawKey) * rawTalent('max_stack_cnt') }
      : {}
  )
);

const flatTalentRuleFactories = {
  '乌尔比安': (rawTalent) => ({
    atk: rawTalent('atk') * rawTalent('max_stack_cnt'),
    maxHp: rawTalent('max_hp') * rawTalent('max_stack_cnt'),
  }),
};

export const resolveFlatTalentBonuses = (memberName, rawTalent) => (
  flatTalentRuleFactories[memberName]?.(rawTalent) ?? { atk: 0, maxHp: 0 }
);

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
  '黑': ({ conditionEffectsEnabled, conditionalMultiplier, rawTalent }) => ({
    atk_scale: conditionalMultiplier('atk_scale'),
    ...(conditionEffectsEnabled ? { attack: rawTalent('atk') } : {}),
  }),
  '协律': activeRawEffect('attack', 'atk'),
  '冬时': activeRawEffect('attack_speed'),
  '摆渡人': activeRawEffect('atk_scale', 'talent_atk_scale'),
  '祐天寺若麦': ({ conditionalMultiplier }) => ({
    damage_scale: conditionalMultiplier('damage_scale'),
  }),
  '哈蒂娅': maxStackAttack,
  '雷狼龙S空爆': maxStackAttack,
  '吉星': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? { damage_scale: 1 + (rawTalent('damage_scale') * rawTalent('max_stack_cnt')) }
      : {}
  ),
  '复奏': activeRawEffect('damage_scale'),
  '伯塔尼': activeStackedEffect('attack_speed'),
  '八幡海铃': activeRawEffect('damage_scale'),
  '焰狐龙梓兰': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          attack: rawTalent('atk'),
          atk_scale: rawTalent('power_attack_scale'),
        }
      : {}
  ),
  '溯光星源': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          attack_speed: rawTalent('attack_speed') * rawTalent('max_stack_cnt'),
          damage_scale: rawTalent('halo2_t_1[weak].damage_scale_max'),
        }
      : {}
  ),
  '望': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          atk_scale: 1 + (
            rawTalent('attack@per_atk_scale') * rawTalent('attack@max_trigger_cnt')
          ),
          magic_resistance: -(
            rawTalent('attack@per_magic_resist_penetrate_fixed')
            * rawTalent('attack@max_trigger_cnt')
          ),
        }
      : {}
  ),
  '斩业星熊': activeRawEffect('attack', 'min_atk'),
  '贝洛内': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          damage_scale: 1 + rawTalent('max_add_on_scale'),
          def_penetrate_fixed: rawTalent('attack@def')
            * rawTalent('attack@limited_stack_cnt'),
        }
      : {}
  ),
  '初雪': activeRawEffect('damage_scale'),
  '巫恋': activeRawEffect('damage_scale'),
  '铃兰': activeRawEffect('damage_scale'),
  '焰影苇草': ({ conditionalMultiplier }) => ({
    damage_scale: conditionalMultiplier('damage_scale'),
  }),
  '濯尘芙蓉': activeRawEffect('damage_scale'),
  '慑砂': activeRawEffect('damage_scale'),
  '天火': activeRawEffect('damage_scale'),
  'THRM-EX': activeRawEffect('damage_scale'),
  '正义骑士号': activeRawEffect('damage_scale'),
  'PhonoR-0': activeRawEffect('damage_scale'),
  '玛恩纳': ({ conditionEffectsEnabled, rawTalent }) => ({
    atk_scale: rawTalent(conditionEffectsEnabled ? 'atk_scale_up' : 'atk_scale_base'),
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
  '焰影苇草': new Set(['atk', 'damage_scale']),
  '死芒': new Set(['max_hp', 'atk', 'def']),
  '电弧': new Set(['max_hp', 'atk', 'def']),
  'Mon3tr': new Set(['atk']),
  '乌尔比安': new Set(['max_hp', 'atk']),
  '陨星': new Set(['atk']),
  '协律': new Set(['atk']),
  '冬时': new Set(['attack_speed']),
  '松桐': new Set(['atk']),
  '祐天寺若麦': new Set(['damage_scale']),
  '哈蒂娅': new Set(['atk']),
  '雷狼龙S空爆': new Set(['atk']),
  '吉星': new Set(['damage_scale']),
  '复奏': new Set(['damage_scale']),
  '雪猎': new Set(['atk_scale']),
  '三角初华': new Set(['atk_scale']),
  '伯塔尼': new Set(['attack_speed']),
  '八幡海铃': new Set(['damage_scale']),
  '焰狐龙梓兰': new Set(['atk']),
  '圣聆初雪': new Set(['damage_scale']),
  '可露希尔': new Set(['damage_scale']),
  '维伊': new Set(['atk', 'attack_speed']),
  '真言': new Set(['atk_scale']),
  '溯光星源': new Set(['attack_speed']),
  '凛御银灰': new Set(['def']),
  '初雪': new Set(['damage_scale']),
  '巫恋': new Set(['damage_scale']),
  '铃兰': new Set(['atk', 'damage_scale']),
  '濯尘芙蓉': new Set(['damage_scale']),
  '慑砂': new Set(['damage_scale']),
  '天火': new Set(['damage_scale']),
  'THRM-EX': new Set(['damage_scale']),
  '正义骑士号': new Set(['damage_scale']),
  'PhonoR-0': new Set(['damage_scale']),
  '归溟幽灵鲨': new Set(['atk_scale']),
  '玛恩纳': new Set(['atk_scale']),
  '黑': new Set(['atk']),
  '诗怀雅': new Set(['atk']),
};

const TalentEffectRulesModel = {
  resolve: (memberName, context) => {
    return talentEffectRuleFactories[memberName]?.(context);
  },
};

export default TalentEffectRulesModel;
