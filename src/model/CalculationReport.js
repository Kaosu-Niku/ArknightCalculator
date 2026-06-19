import BasicCalculatorModel from './BasicCalculator';
import SkillCalculatorModel from './SkillCalculator';
import TalentDataIndexModel from './TalentDataIndex';
import TalentsCalculatorModel from './TalentsCalculator';
import UniequipCalculatorModel from './UniequipCalculator';
import UniequipDataIndexModel from './UniequipDataIndex';

const createTalentBreakdown = (
  type,
  member,
  uniequipJsonData,
  battleEquipJsonData
) => {
  const talentData = TalentDataIndexModel.resolve(type, member);
  const equipData = UniequipDataIndexModel.resolve(
    member,
    uniequipJsonData,
    battleEquipJsonData
  );
  const keys = new Set([
    ...talentData.values.keys(),
    ...equipData.talentBlackboard.keys(),
  ]);

  return Object.fromEntries(Array.from(keys).sort().map(key => [
    key,
    TalentsCalculatorModel.memberTalent(
      type,
      member,
      uniequipJsonData,
      battleEquipJsonData,
      key
    ),
  ]));
};

const createSkillRows = (member, skillJsonData) => {
  return (member.skills ?? []).flatMap(skillReference => {
    const skill = skillJsonData[skillReference.skillId];
    return skill ? [{ ...skill, skillId: skillReference.skillId, equipid: member.equipid }] : [];
  });
};

const CalculationReportModel = {
  create: ({
    memberName,
    type,
    enemyData,
    candidates,
    calculatorData,
  }) => {
    if(!memberName || !calculatorData){
      return null;
    }

    const {
      characterJsonData,
      professionJsonData,
      subProfessionIdJsonData,
      uniequipJsonData,
      battleEquipJsonData,
      skillJsonData,
    } = calculatorData;
    const member = Object.values(characterJsonData).find(character => {
      return character.name === memberName
        && character.profession !== 'TOKEN'
        && character.profession !== 'TRAP';
    });

    if(!member){
      return null;
    }

    const canUseModules = BasicCalculatorModel.type(type).witchPhases === 2;
    const equipIds = canUseModules
      ? (UniequipCalculatorModel.memberEquipID(member, uniequipJsonData) ?? [])
        .filter(equipId => !equipId.includes('_001_'))
      : [];
    const variants = [
      { id: 'base', member, moduleName: '無模組' },
      ...equipIds.map(equipId => {
        const variantMember = { ...member, equipid: equipId };
        return {
          id: equipId,
          member: variantMember,
          moduleName: UniequipCalculatorModel.memberEquipData(
            variantMember,
            uniequipJsonData
          )?.uniEquipName ?? equipId,
        };
      }),
    ];
    const characterRows = [
      ...Object.values(characterJsonData),
      ...variants.slice(1).map(variant => variant.member),
    ];

    return {
      member: {
        name: member.name,
        rarity: BasicCalculatorModel.memberRarity(member),
        profession: BasicCalculatorModel.memberProfession(member, professionJsonData)?.chineseName,
        subProfession: BasicCalculatorModel.memberSubProfessionId(member, subProfessionIdJsonData)?.chineseName,
      },
      type,
      candidates,
      enemy: {
        defense: enemyData.enemyDef,
        resistance: enemyData.enemyRes,
      },
      variants: variants.map(variant => ({
        id: variant.id,
        moduleName: variant.moduleName,
        numeric: BasicCalculatorModel.memberNumericBreakdown(
          type,
          variant.member,
          uniequipJsonData,
          battleEquipJsonData
        ),
        talents: createTalentBreakdown(
          type,
          variant.member,
          uniequipJsonData,
          battleEquipJsonData
        ),
        skills: createSkillRows(variant.member, skillJsonData).map(skillRow => (
          SkillCalculatorModel.skillMemberReport(
            type,
            skillRow,
            characterRows,
            enemyData,
            subProfessionIdJsonData,
            uniequipJsonData,
            battleEquipJsonData,
            candidates
          )
        )),
      })),
    };
  },
};

export default CalculationReportModel;
