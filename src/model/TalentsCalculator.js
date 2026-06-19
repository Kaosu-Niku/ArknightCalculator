import TalentDataIndexModel from './TalentDataIndex';
import { talentExcludedAttributes } from './talentEffectRules';
import UniequipCalculatorModel from './UniequipCalculator';

const memberTalentCache = new WeakMap();

const isTalentExcluded = (memberName, attribute) => {
  return talentExcludedAttributes[memberName]?.has(attribute) ?? false;
};

const resolveRawTalent = (
  type,
  memberRow,
  uniequipJsonData,
  battleEquipJsonData,
  attribute
) => {
  const talentData = TalentDataIndexModel.resolve(type, memberRow);
  let value = talentData.values.has(attribute)
    ? talentData.values.get(attribute)
    : undefined;

  if (talentData.witchPhases === 2) {
    const uniequipValue = UniequipCalculatorModel.memberEquipTalent(
      memberRow.equipid,
      memberRow,
      uniequipJsonData,
      battleEquipJsonData,
      talentData.witchPhases,
      attribute
    );

    if (uniequipValue !== undefined) {
      value = uniequipValue;
    }
  }

  return value;
};

const TalentsCalculatorModel = {
  memberTalentRawOptional: (
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  ) => resolveRawTalent(
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  ),

  memberTalentRaw: (
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  ) => resolveRawTalent(
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  ) ?? 0,

  memberTalent: (
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  ) => {
    const cacheKey = `${type}::${memberRow.equipid ?? ''}::${attribute}`;
    const cachedByMember = memberTalentCache.get(memberRow);
    if (cachedByMember?.has(cacheKey)) {
      return cachedByMember.get(cacheKey);
    }

    const excluded = isTalentExcluded(memberRow.name, attribute);
    const addTotal = excluded ? 0 : (resolveRawTalent(
      type,
      memberRow,
      uniequipJsonData,
      battleEquipJsonData,
      attribute
    ) ?? 0);

    if (cachedByMember) {
      cachedByMember.set(cacheKey, addTotal);
    }
    else {
      memberTalentCache.set(memberRow, new Map([[cacheKey, addTotal]]));
    }

    return addTotal;
  },
};

export default TalentsCalculatorModel;
