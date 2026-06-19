import BasicCalculatorModel from './BasicCalculator';
import SkillCustomCalculatorModel from './SkillCustomCalculator';
import SkillDataIndexModel from './SkillDataIndex';
import SkillEffectResolverModel from './SkillEffectResolver';
import TalentsCustomCalculatorModel from './TalentsCustomCalculator';
import UniequipCalculatorModel from './UniequipCalculator';

const CalculationContextModel = {
  createSkillAttributeContext: ({
    type,
    skillRow,
    memberData,
    uniequipJsonData,
    battleEquipJsonData,
    candidates_check = false,
  }, helpers) => {
    const skillData = helpers.skillData(type, skillRow);
    const skillBlackboard = SkillDataIndexModel.blackboard(skillData);
    const checkName = `${memberData.name}-${skillData.name}`;
    const skillAttribute = (attribute) => {
      return skillBlackboard.get(attribute)?.value ?? 0;
    };
    const skillAttributeOptional = (attribute) => {
      return skillBlackboard.get(attribute)?.value;
    };
    const skillEffectRule = SkillCustomCalculatorModel.createSkillEffectRule({
      checkName,
      type,
      skillRow: skillRow,
      memberRow: memberData,
      uniequipJsonData,
      battleEquipJsonData,
      skillAttribute,
      skillAttributeOptional,
      conditionEffectsEnabled: candidates_check,
    });
    const skillEffects = SkillEffectResolverModel.createSkillEffects({
      skillData,
      blackboardIndex: skillBlackboard,
      rule: skillEffectRule,
    });

    return { skillEffects };
  },

  createSkillContext: ({
    type,
    skillRow,
    characterJsonData,
    subProfessionIdJsonData,
    uniequipJsonData,
    battleEquipJsonData,
    candidates_check = false,
    memberData = null,
  }, helpers) => {
    const typeInfo = BasicCalculatorModel.type(type);
    const currentMemberData = memberData ?? helpers.skillFromMember(skillRow, characterJsonData);
    const skillData = helpers.skillData(type, skillRow);
    const skillBlackboard = SkillDataIndexModel.blackboard(skillData);
    const subProfessionData = BasicCalculatorModel.memberSubProfessionId(currentMemberData, subProfessionIdJsonData);
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, currentMemberData, uniequipJsonData, battleEquipJsonData);
    const talentEffectRule = TalentsCustomCalculatorModel.createTalentEffectRule({
      type,
      memberRow: currentMemberData,
      uniequipJsonData,
      battleEquipJsonData,
      conditionEffectsEnabled: candidates_check,
      probabilityOverride: skillBlackboard.get('talent@prob')?.value,
    });
    const memberTalent = talentEffectRule.effects;
    const checkName = `${currentMemberData.name}-${skillData.name}`;
    const skillAttribute = (attribute) => {
      return skillBlackboard.get(attribute)?.value ?? 0;
    };
    const skillAttributeOptional = (attribute) => {
      return skillBlackboard.get(attribute)?.value;
    };
    const skillEffectRule = SkillCustomCalculatorModel.createSkillEffectRule({
      checkName,
      type,
      skillRow: skillRow,
      memberRow: currentMemberData,
      uniequipJsonData,
      battleEquipJsonData,
      skillAttribute,
      skillAttributeOptional,
      conditionEffectsEnabled: candidates_check,
    });
    const skillEffects = SkillEffectResolverModel.createSkillEffects({
      skillData,
      blackboardIndex: skillBlackboard,
      rule: skillEffectRule,
    });
    const equipTraitCache = new Map();

    const memberEquipTrait = (attributeKey) => {
      if (equipTraitCache.has(attributeKey)) {
        return equipTraitCache.get(attributeKey);
      }

      const value = UniequipCalculatorModel.memberEquipTrait(
        skillRow.equipid,
        currentMemberData,
        uniequipJsonData,
        battleEquipJsonData,
        typeInfo.witchPhases,
        candidates_check,
        subProfessionData.chineseName,
        attributeKey
      );
      equipTraitCache.set(attributeKey, value);
      return value;
    };

    return {
      skillRow,
      skillData,
      skillBlackboard,
      checkName,
      memberData: currentMemberData,
      subProfessionName: subProfessionData.chineseName,
      attackType: subProfessionData.attackType,
      memberNumeric,
      memberTalent,
      skillEffects,
      memberEquipTrait,
    };
  },
};

export default CalculationContextModel;
