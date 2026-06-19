import SkillEffectRulesModel from './skillEffectRules';
import {
  conditionalAdditive,
  conditionalMultiplier,
  normalizeProbability,
} from './conditionalEffect';

const skillRuleCache = new WeakMap();
const emptyIgnoredAttributes = new Set();

const SkillCustomCalculatorModel = {
  hasConditionalEffect: (checkName) => (
    SkillEffectRulesModel.hasConditionalEffect(checkName)
  ),

  // JSON 中同名 key 的語意不一致時，這裡排除不能直接帶入公式的原始值。
  skillNotListToBasic: {
    '石英-全力相搏': new Set(['damage_scale']),
    '猎蜂-急速拳': new Set(['base_attack_time']),
    '断罪者-断罪': new Set(['atk_scale']),
    '深靛-灯塔守卫者': new Set(['base_attack_time']),
    '深靛-光影迷宫': new Set(['base_attack_time']),
    '深海色-光影之触': new Set(['atk']),
    '巫恋-诅咒娃娃': new Set(['atk']),
    '锡人-“老科利”': new Set(['atk']),
    '引星棘刺-“我的海疆”': new Set(['atk']),
    '山-横扫架势': new Set(['def']),
    '银灰-真银斩': new Set(['def']),
    '初雪-传音回响': new Set(['attack_speed']),
    '战车-倾泻弹药': new Set(['atk_scale']),
    '鸿雪-抑扬格': new Set(['atk_scale']),
    '吉星-欢迎您来！': new Set(['atk']),
    '遥-幽隙栖萤': new Set(['atk']),
    '真言-无言为真': new Set(['atk_scale']),
    '伯塔尼-谐波破坏': new Set(['atk_scale']),
    '丰川祥子-新月的苏醒': new Set(['atk_scale']),
    '怒潮凛冬-无可抵挡': new Set(['atk_scale']),
    '号角-终极防线': new Set(['atk']),
    '棘刺-至高之术': new Set(['atk', 'attack_speed']),
    '怒潮凛冬-绝不罢休': new Set(['atk']),
    '遥-幽隙栖萤': new Set(['atk']),
  },

  createSkillEffectRule: ({
    checkName,
    type,
    skillRow,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    skillAttribute,
    skillAttributeOptional,
    conditionEffectsEnabled = false,
  }) => {
    const cacheKey = `${type}::${memberRow?.name ?? ''}::${memberRow?.equipid ?? ''}::${checkName}::${conditionEffectsEnabled}`;
    const cachedBySkill = skillRuleCache.get(skillRow);
    if (cachedBySkill?.has(cacheKey)) {
      return cachedBySkill.get(cacheKey);
    }

    const rule = {
      name: checkName,
      effects: SkillEffectRulesModel.resolve(checkName, {
        type,
        memberRow,
        uniequipJsonData,
        battleEquipJsonData,
        skillAttribute,
        conditionEffectsEnabled,
        conditionalAdditive: (attribute, probabilityAttribute = 'prob') => (
          conditionalAdditive(
            conditionEffectsEnabled,
            skillAttributeOptional(attribute) ?? 0,
            normalizeProbability(skillAttributeOptional(probabilityAttribute), 1)
          )
        ),
        conditionalMultiplier: (attribute, probabilityAttribute = 'prob') => (
          conditionalMultiplier(
            conditionEffectsEnabled,
            skillAttributeOptional(attribute) ?? 1,
            normalizeProbability(skillAttributeOptional(probabilityAttribute), 1)
          )
        ),
      }),
      ignoredAttributes: SkillCustomCalculatorModel.skillNotListToBasic[checkName]
        ?? emptyIgnoredAttributes,
    };

    if (cachedBySkill) {
      cachedBySkill.set(cacheKey, rule);
    }
    else {
      skillRuleCache.set(skillRow, new Map([[cacheKey, rule]]));
    }

    return rule;
  },
};

export default SkillCustomCalculatorModel;
