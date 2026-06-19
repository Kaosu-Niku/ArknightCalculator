import TalentsCalculatorModel from './TalentsCalculator';
import TalentEffectRulesModel, { talentExcludedAttributes } from './talentEffectRules';

const talentRuleCache = new WeakMap();
const emptyIgnoredAttributes = new Set();

const createRuleContext = (
  type,
  memberRow,
  uniequipJsonData,
  battleEquipJsonData
) => ({
  memberTalent: (attribute) => TalentsCalculatorModel.memberTalent(
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  ),
});

const TalentsCustomCalculatorModel = {
  talentNotListToBasic: talentExcludedAttributes,

  createTalentEffectRule: ({
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
  }) => {
    const memberName = memberRow.name;
    const cacheKey = `${type}::${memberRow?.equipid ?? ''}::${memberName}`;
    const cachedByMember = talentRuleCache.get(memberRow);
    if (cachedByMember?.has(cacheKey)) {
      return cachedByMember.get(cacheKey);
    }

    const rule = {
      name: memberName,
      effects: TalentEffectRulesModel.resolve(
        memberName,
        createRuleContext(type, memberRow, uniequipJsonData, battleEquipJsonData)
      ),
      ignoredAttributes: talentExcludedAttributes[memberName]
        ?? emptyIgnoredAttributes,
    };

    if (cachedByMember) {
      cachedByMember.set(cacheKey, rule);
    }
    else {
      talentRuleCache.set(memberRow, new Map([[cacheKey, rule]]));
    }

    return rule;
  },
};

export default TalentsCustomCalculatorModel;
