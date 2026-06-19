import TalentDataIndexModel from './TalentDataIndex';
import { talentExcludedAttributes } from './talentEffectRules';
import UniequipCalculatorModel from './UniequipCalculator';

const memberTalentCache = new WeakMap();

const isTalentExcluded = (memberName, attribute) => {
  return talentExcludedAttributes[memberName]?.has(attribute) ?? false;
};

const TalentsCalculatorModel = {
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

    const talentData = TalentDataIndexModel.resolve(type, memberRow);
    const excluded = isTalentExcluded(memberRow.name, attribute);
    let addTotal = excluded ? 0 : talentData.values.get(attribute) ?? 0;

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
        addTotal = excluded ? 0 : uniequipValue;
      }
    }

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
