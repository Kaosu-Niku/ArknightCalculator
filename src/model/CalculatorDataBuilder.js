import BasicCalculatorModel from './BasicCalculator';
import FilterModel from './Filter';
import SkillCalculatorModel from './SkillCalculator';
import UniequipCalculatorModel from './UniequipCalculator';

const jsonPaths = {
  professionJsonData: 'profession.json',
  subProfessionIdJsonData: 'subProfessionId.json',
  characterJsonData: 'character_table.json',
  uniequipJsonData: 'uniequip_table.json',
  battleEquipJsonData: 'battle_equip_table.json',
  skillJsonData: 'skill_table.json',
};

const CalculatorDataBuilderModel = {
  loadCalculatorJson: async (publicUrl) => {
    const entries = await Promise.all(
      Object.entries(jsonPaths).map(async ([key, fileName]) => {
        const response = await fetch(`${publicUrl}/json/${fileName}`);
        return [key, await response.json()];
      })
    );

    return Object.fromEntries(entries);
  },

  buildCharacterRows: ({ type, characterJsonData, checkRarity, uniequipJsonData }) => {
    const witchPhases = BasicCalculatorModel.type(type).witchPhases;
    const processedCharacterData = FilterModel.characterDataFilter(
      Object.values(characterJsonData),
      checkRarity
    );

    if(witchPhases !== 2){
      return processedCharacterData;
    }

    const moduleRows = processedCharacterData.flatMap(currentMember => {
      const uniequipContentList = UniequipCalculatorModel.memberEquipID(currentMember, uniequipJsonData);
      return (uniequipContentList ?? [])
        .filter(equipId => !equipId.includes('_001_'))
        .map(equipId => ({ ...currentMember, equipid: equipId }));
    });

    return [...processedCharacterData, ...moduleRows];
  },

  buildSkillRows: ({ type, skillJsonData, characterJsonData, processedCharacterData, checkRarity, uniequipJsonData }) => {
    const witchPhases = BasicCalculatorModel.type(type).witchPhases;
    const processedSkillData = FilterModel.skillDataFilter(Object.values(skillJsonData), characterJsonData, checkRarity);

    if(witchPhases !== 2){
      return processedSkillData;
    }

    const moduleRows = processedSkillData.flatMap(currentSkill => {
      const currentMember = SkillCalculatorModel.skillFromMember(currentSkill, processedCharacterData);
      const uniequipContentList = UniequipCalculatorModel.memberEquipID(currentMember, uniequipJsonData);
      return (uniequipContentList ?? [])
        .filter(equipId => !equipId.includes('_001_'))
        .map(equipId => ({ ...currentSkill, equipid: equipId }));
    });

    return [...processedSkillData, ...moduleRows];
  },
};

export default CalculatorDataBuilderModel;
