import BasicCalculatorModel from '../BasicCalculator';
import CalculationReportModel from '../CalculationReport';
import SkillCalculatorModel from '../SkillCalculator';

const calculatorData = {
  characterJsonData: require('../../../public/json/character_table.json'),
  professionJsonData: require('../../../public/json/profession.json'),
  subProfessionIdJsonData: require('../../../public/json/subProfessionId.json'),
  uniequipJsonData: require('../../../public/json/uniequip_table.json'),
  battleEquipJsonData: require('../../../public/json/battle_equip_table.json'),
  skillJsonData: require('../../../public/json/skill_table.json'),
};
const enemyData = {
  enemyDef: 500,
  enemyRes: 30,
};

describe('calculation report', () => {
  const report = CalculationReportModel.create({
    memberName: '维什戴尔',
    type: '精二滿級',
    enemyData,
    candidates: true,
    calculatorData,
  });

  test('reconciles every numeric breakdown with the calculator', () => {
    for(const variant of report.variants){
      const member = variant.id === 'base'
        ? Object.values(calculatorData.characterJsonData).find(item => item.name === report.member.name)
        : {
            ...Object.values(calculatorData.characterJsonData).find(item => item.name === report.member.name),
            equipid: variant.id,
          };
      expect(variant.numeric.final).toEqual(BasicCalculatorModel.memberNumeric(
        '精二滿級',
        member,
        calculatorData.uniequipJsonData,
        calculatorData.battleEquipJsonData
      ));
    }
  });

  test('reconciles skill streams with the table total', () => {
    const baseMember = Object.values(calculatorData.characterJsonData)
      .find(item => item.name === report.member.name);

    for(const variant of report.variants){
      const member = variant.id === 'base'
        ? baseMember
        : { ...baseMember, equipid: variant.id };
      const characterRows = [...Object.values(calculatorData.characterJsonData), member];

      for(const skill of variant.skills){
        const skillRow = {
          ...calculatorData.skillJsonData[skill.skillId],
          skillId: skill.skillId,
          ...(skill.equipId ? { equipid: skill.equipId } : {}),
        };
        const tableMetrics = SkillCalculatorModel.skillMemberMetrics(
          '精二滿級',
          skillRow,
          characterRows,
          enemyData,
          calculatorData.subProfessionIdJsonData,
          calculatorData.uniequipJsonData,
          calculatorData.battleEquipJsonData,
          true
        );

        expect(skill.dps).toBeCloseTo(tableMetrics.dps);
        expect(skill.total).toBeCloseTo(tableMetrics.total);
        expect(skill.streams.reduce((total, stream) => total + stream.total, 0))
          .toBeCloseTo(tableMetrics.total);
      }
    }
  });
});
