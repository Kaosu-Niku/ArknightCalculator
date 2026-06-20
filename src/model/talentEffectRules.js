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
  'THRM-EX': activeRawEffect('damage_scale'),
  '正义骑士号': activeRawEffect('damage_scale'),
  'PhonoR-0': activeRawEffect('damage_scale'),
  '克洛丝': expectedAttackScale,
  '夜烟': ({ memberTalent }) => ({
    magic_resistance: memberTalent('magic_resistance'),
  }),
  '协律': activeRawEffect('attack', 'atk'),
  '卡达': () => ({}),
  '流星': activeRawEffect('atk_scale'),
  '酸糖': ({ conditionEffectsEnabled, memberTalent }) => ({
    ...effectWhenActive(
      'ensure_damage',
      memberTalent(conditionEffectsEnabled ? 'atk_scale_2' : 'atk_scale')
    ),
  }),
  '跃跃': expectedAttackScale,
  '红豆': expectedAttackBonus('prob2'),
  '冬时': activeRawEffect('attack_speed'),
  '宴': ({ conditionEffectsEnabled, memberTalent }) => (
    conditionEffectsEnabled
      ? { attack_speed: memberTalent('min_attack_speed') }
      : {}
  ),
  '芳汀': activeRawEffect('atk_scale'),
  '骋风': () => ({}),
  '孑': activeRawEffect('atk_scale'),
  '古米': expectedAttackScale,
  '云迹': ({ conditionEffectsEnabled, memberTalent }) => (
    conditionEffectsEnabled
      ? effectWhenActive('atk_scale', memberTalent('atk_scale'))
      : {}
  ),
  '谜图': activeRawEffect('atk_scale'),
  '燧石': activeRawEffect('damage_scale'),
  '摆渡人': activeRawEffect('atk_scale', 'talent_atk_scale'),
  '祐天寺若麦': ({ conditionalMultiplier }) => ({
    damage_scale: conditionalMultiplier('damage_scale'),
  }),
  '哈蒂娅': maxStackAttack,
  '雷狼龙S空爆': maxStackAttack,
  '灰喉': ({ conditionalMultiplier, rawTalent }) => ({
    attack_speed: rawTalent('attack_speed'),
    atk_scale: conditionalMultiplier('atk_scale'),
  }),
  '寒芒克洛丝': expectedAttackScale,
  '陨星': expectedAttackBonus(),
  '慑砂': activeRawEffect('damage_scale'),
  '吉星': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? { damage_scale: 1 + (rawTalent('damage_scale') * rawTalent('max_stack_cnt')) }
      : {}
  ),
  '苦艾': activeRawEffect('damage_scale'),
  '天火': activeRawEffect('damage_scale'),
  '惊蛰': activeRawEffect('atk_scale'),
  '莱恩哈特': maxStackAttack,
  '复奏': activeRawEffect('damage_scale'),
  '和弦': activeRawEffect('atk_scale'),
  '戴菲恩': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          atk_scale: rawTalent('atk_scale'),
          damage_scale: rawTalent('damage_scale'),
        }
      : {}
  ),
  '至简': expectedAttackScale,
  '衡沙': ({ conditionEffectsEnabled, rawTalent }) => ({
    damage_scale: conditionEffectsEnabled ? rawTalent('damage_scale') : 1,
  }),
  '濯尘芙蓉': activeRawEffect('damage_scale'),
  '裁度': activeRawEffect('damage_scale'),
  '闪击': activeRawEffect('atk_scale'),
  '普罗旺斯': ({ conditionalMultiplier }) => ({
    atk_scale: conditionalMultiplier('atk_scale', 'prob2'),
  }),
  '守林人': activeRawEffect('atk_scale'),
  '熔泉': activeRawEffect('atk_scale'),
  '初雪': activeRawEffect('damage_scale'),
  '巫恋': activeRawEffect('damage_scale'),
  '格劳克斯': activeRawEffect('atk_scale'),
  '伯塔尼': activeStackedEffect('attack_speed'),
  '八幡海铃': activeRawEffect('damage_scale'),
  '黑': ({ conditionEffectsEnabled, conditionalMultiplier, rawTalent }) => ({
    atk_scale: conditionalMultiplier('atk_scale'),
    ...(conditionEffectsEnabled ? { attack: rawTalent('atk') } : {}),
  }),
  '焰狐龙梓兰': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          attack: rawTalent('atk'),
          atk_scale: rawTalent('power_attack_scale'),
        }
      : {}
  ),
  '蕾缪安': ({ conditionEffectsEnabled, rawTalent }) => ({
    damage_scale: conditionEffectsEnabled ? rawTalent('damage_scale') : 1,
    ...(conditionEffectsEnabled ? { attack: rawTalent('atk') } : {}),
  }),
  'W': activeRawEffect('damage_scale'),
  '莱伊': maxStackAttack,
  '风笛': expectedAttackScale,
  '刻俄柏': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          attack: rawTalent('atk'),
          attack_speed: rawTalent('attack_speed'),
        }
      : {}
  ),
  '霍尔海雅': activeRawEffect('atk_scale'),
  '夕': maxStackAttack,
  '妮芙': maxStackAttack,
  '铃兰': activeRawEffect('damage_scale'),
  '溯光星源': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          attack_speed: rawTalent('attack_speed') * rawTalent('max_stack_cnt'),
          damage_scale: rawTalent('halo2_t_1[weak].damage_scale_max'),
        }
      : {}
  ),
  '令': maxStackAttack,
  '缄默德克萨斯': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          attack: rawTalent('atk'),
          attack_speed: rawTalent('attack_speed'),
        }
      : {}
  ),
  '琳琅诗怀雅': maxStackAttack,
  '阿': ({ conditionEffectsEnabled, rawTalent }) => ({
    atk_scale: conditionEffectsEnabled
      ? 1 + ((rawTalent('atk_scale') - 1) * 0.25)
      : 1,
  }),
  '歌蕾蒂娅': activeRawEffect('atk_scale'),
  '多萝西': maxStackAttack,
  '艾拉': expectedAttackScale,
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
  '焰影苇草': ({ conditionalMultiplier }) => ({
    damage_scale: conditionalMultiplier('damage_scale'),
  }),
  '塞雷娅': maxStackAttack,
  '斩业星熊': activeRawEffect('attack', 'min_atk'),
  '山': expectedAttackScale,
  '贝洛内': ({ conditionEffectsEnabled, rawTalent }) => (
    conditionEffectsEnabled
      ? {
          damage_scale: 1 + rawTalent('max_add_on_scale'),
          def_penetrate_fixed: rawTalent('attack@def')
            * rawTalent('attack@limited_stack_cnt'),
        }
      : {}
  ),
  '赫德雷': ({ conditionEffectsEnabled, rawTalent }) => ({
    atk_scale: rawTalent(conditionEffectsEnabled ? 'atk_scale' : 'atk_scale_2'),
  }),
  '锏': expectedAttackScale,
  '薇薇安娜': ({ conditionEffectsEnabled, rawTalent }) => ({
    damage_scale: 1 + (
      rawTalent('damage_scale_m')
      * (conditionEffectsEnabled ? rawTalent('super_scale') : 1)
    ),
  }),
  '玛恩纳': ({ conditionEffectsEnabled, rawTalent }) => ({
    atk_scale: rawTalent(conditionEffectsEnabled ? 'atk_scale_up' : 'atk_scale_base'),
  }),
  '月见夜': expectedAttackScale,
  '猎蜂': maxStackAttack,
  '森蚺': activeRawEffect('atk_scale'),
  '红隼': expectedAttackScale,
  'Stormeye': expectedAttackScale,
};

export const talentExcludedAttributes = {
  'THRM-EX': new Set(['damage_scale']),
  '正义骑士号': new Set(['damage_scale']),
  'PhonoR-0': new Set(['damage_scale']),
  '克洛丝': new Set(['atk_scale']),
  '远山': new Set(['max_hp', 'atk', 'attack_speed']),
  '协律': new Set(['atk']),
  '流星': new Set(['atk_scale']),
  '铅踝': new Set(['atk']),
  '跃跃': new Set(['atk_scale']),
  '讯使': new Set(['def']),
  '清道夫': new Set(['atk', 'def']),
  '红豆': new Set(['atk']),
  '冬时': new Set(['attack_speed']),
  '杜宾': new Set(['atk']),
  '芳汀': new Set(['atk_scale']),
  '孑': new Set(['atk_scale']),
  '嘉维尔': new Set(['atk', 'def']),
  '泡泡': new Set(['atk']),
  '古米': new Set(['atk_scale']),
  '松桐': new Set(['atk']),
  '谜图': new Set(['atk_scale']),
  '诗怀雅': new Set(['atk']),
  '燧石': new Set(['damage_scale']),
  '火龙S黑角': new Set(['atk']),
  '龙舌兰': new Set(['atk_scale']),
  '祐天寺若麦': new Set(['damage_scale']),
  '哈蒂娅': new Set(['atk']),
  '雷狼龙S空爆': new Set(['atk']),
  '灰喉': new Set(['attack_speed', 'atk_scale']),
  '寒芒克洛丝': new Set(['atk_scale']),
  '陨星': new Set(['atk']),
  '慑砂': new Set(['damage_scale']),
  '奥斯塔': new Set(['atk_scale']),
  '吉星': new Set(['damage_scale']),
  '苦艾': new Set(['damage_scale']),
  '天火': new Set(['damage_scale']),
  '惊蛰': new Set(['atk_scale']),
  '莱恩哈特': new Set(['atk']),
  '复奏': new Set(['damage_scale']),
  '和弦': new Set(['atk_scale']),
  '戴菲恩': new Set(['atk_scale', 'damage_scale']),
  '至简': new Set(['atk_scale']),
  '衡沙': new Set(['damage_scale']),
  '亚叶': new Set(['damage_scale']),
  '濯尘芙蓉': new Set(['damage_scale']),
  '裁度': new Set(['damage_scale']),
  '车尔尼': new Set(['atk_scale']),
  '闪击': new Set(['atk_scale']),
  '普罗旺斯': new Set(['atk_scale']),
  '守林人': new Set(['atk_scale']),
  '熔泉': new Set(['atk_scale']),
  '雪猎': new Set(['atk_scale']),
  '初雪': new Set(['damage_scale']),
  '巫恋': new Set(['damage_scale']),
  '格劳克斯': new Set(['atk_scale']),
  '三角初华': new Set(['atk_scale']),
  '伯塔尼': new Set(['attack_speed']),
  '八幡海铃': new Set(['damage_scale']),
  '黑': new Set(['atk']),
  '焰狐龙梓兰': new Set(['atk']),
  '蕾缪安': new Set(['atk', 'damage_scale']),
  'W': new Set(['damage_scale']),
  '莱伊': new Set(['atk']),
  '忍冬': new Set(['atk_scale']),
  '凛御银灰': new Set(['def']),
  '刻俄柏': new Set(['atk', 'attack_speed', 'atk_scale']),
  '霍尔海雅': new Set(['atk_scale']),
  '夕': new Set(['atk']),
  '林': new Set(['atk_scale']),
  '圣聆初雪': new Set(['damage_scale']),
  '黑键': new Set(['atk_scale']),
  '维伊': new Set(['atk', 'attack_speed']),
  '妮芙': new Set(['atk']),
  '真言': new Set(['atk_scale']),
  '死芒': new Set(['max_hp', 'atk', 'def']),
  '铃兰': new Set(['atk', 'damage_scale']),
  '溯光星源': new Set(['attack_speed']),
  '电弧': new Set(['max_hp', 'atk', 'def']),
  '令': new Set(['atk']),
  '缄默德克萨斯': new Set(['atk', 'attack_speed']),
  '琳琅诗怀雅': new Set(['atk']),
  '阿': new Set(['atk_scale']),
  '歌蕾蒂娅': new Set(['atk_scale']),
  '归溟幽灵鲨': new Set(['atk_scale']),
  '多萝西': new Set(['atk']),
  '艾拉': new Set(['atk_scale']),
  '焰影苇草': new Set(['atk', 'damage_scale']),
  '塞雷娅': new Set(['atk']),
  '斥罪': new Set(['atk_scale']),
  '山': new Set(['atk']),
  '仇白': new Set(['atk_scale']),
  '赫德雷': new Set(['atk_scale']),
  '乌尔比安': new Set(['max_hp', 'atk']),
  '维娜·维多利亚': new Set(['atk']),
  '耀骑士临光': new Set(['atk_scale']),
  '止颂': new Set(['atk']),
  '玛恩纳': new Set(['atk_scale']),
  '猎蜂': new Set(['atk']),
  '森蚺': new Set(['atk_scale']),
  '红隼': new Set(['atk_scale']),
  'Mon3tr': new Set(['atk']),
  '可露希尔': new Set(['damage_scale']),
};

const TalentEffectRulesModel = {
  resolve: (memberName, context) => {
    return talentEffectRuleFactories[memberName]?.(context);
  },
};

export default TalentEffectRulesModel;
