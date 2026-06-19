import TalentsCalculatorModel from './TalentsCalculator';
import TalentEffectRulesModel, { talentExcludedAttributes } from './talentEffectRules';
import {
  conditionalAdditive,
  conditionalMultiplier,
  normalizeProbability,
} from './conditionalEffect';

const talentRuleCache = new WeakMap();
const emptyIgnoredAttributes = new Set();

const createRuleContext = (
  type,
  memberRow,
  uniequipJsonData,
  battleEquipJsonData,
  conditionEffectsEnabled,
  probabilityOverride
) => {
  const rawTalentOptional = (attribute) => (
    TalentsCalculatorModel.memberTalentRawOptional(
      type,
      memberRow,
      uniequipJsonData,
      battleEquipJsonData,
      attribute
    )
  );
  const probability = (attribute = 'prob') => {
    const value = attribute === 'prob' && probabilityOverride !== undefined
      ? probabilityOverride
      : rawTalentOptional(attribute);
    return normalizeProbability(value, 1);
  };

  return {
  conditionEffectsEnabled,
  memberTalent: (attribute) => TalentsCalculatorModel.memberTalent(
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  ),
  rawTalent: (attribute) => TalentsCalculatorModel.memberTalentRaw(
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  ),
  conditionalAdditive: (attribute, probabilityAttribute = 'prob') => (
    conditionalAdditive(
      conditionEffectsEnabled,
      rawTalentOptional(attribute) ?? 0,
      probability(probabilityAttribute)
    )
  ),
  conditionalMultiplier: (attribute, probabilityAttribute = 'prob') => (
    conditionalMultiplier(
      conditionEffectsEnabled,
      rawTalentOptional(attribute) ?? 1,
      probability(probabilityAttribute)
    )
  ),
  };
};

const TalentsCustomCalculatorModel = {
  talentNotListToBasic: talentExcludedAttributes,

  createTalentEffectRule: ({
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    conditionEffectsEnabled = false,
    probabilityOverride,
  }) => {
    const memberName = memberRow.name;
    const cacheKey = `${type}::${memberRow?.equipid ?? ''}::${memberName}::${conditionEffectsEnabled}::${probabilityOverride ?? ''}`;
    const cachedByMember = talentRuleCache.get(memberRow);
    if (cachedByMember?.has(cacheKey)) {
      return cachedByMember.get(cacheKey);
    }

    const rule = {
      name: memberName,
      effects: TalentEffectRulesModel.resolve(
        memberName,
        createRuleContext(
          type,
          memberRow,
          uniequipJsonData,
          battleEquipJsonData,
          conditionEffectsEnabled,
          probabilityOverride
        )
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
