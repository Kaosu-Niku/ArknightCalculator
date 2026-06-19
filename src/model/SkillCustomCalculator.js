import SkillEffectRulesModel from './skillEffectRules';

const skillRuleCache = new WeakMap();
const emptyIgnoredAttributes = new Set();

const SkillCustomCalculatorModel = {
  // JSON 中同名 key 的語意不一致時，這裡排除不能直接帶入公式的原始值。
  skillNotListToBasic: {
    '石英-全力相搏': new Set(['damage_scale']),
    '猎蜂-急速拳': new Set(['base_attack_time']),
    '断罪者-断罪': new Set(['atk_scale']),
    '深靛-灯塔守卫者': new Set(['base_attack_time']),
    '深靛-光影迷宫': new Set(['base_attack_time']),
    '深海色-光影之触': new Set(['atk']),
  },

  createSkillEffectRule: ({
    checkName,
    type,
    skillRow,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    skillAttribute,
  }) => {
    const cacheKey = `${type}::${memberRow?.name ?? ''}::${memberRow?.equipid ?? ''}::${checkName}`;
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
