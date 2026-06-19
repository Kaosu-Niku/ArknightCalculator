import SkillCalculatorModel from './SkillCalculator';

const FilterModel = {
  numberFilter: (number) => {
    return Number.isInteger(number) ? number : Math.trunc(number);
  },

  characterDataFilter: (processedCharacterData, checkRarity) => {
    return processedCharacterData.filter(item => {
      const isOperator = item.profession !== 'TRAP' && item.profession !== 'TOKEN';
      return isOperator && checkRarity[item.rarity] !== false;
    });
  },
    
  skillDataFilter: (processedSkillData, characterJsonData, checkRarity) => {
    return processedSkillData.filter(item => {
      const data = SkillCalculatorModel.skillFromMember(item, characterJsonData);
      if(data === null){
        return false;
      }

      const isOperator = data.profession !== 'TRAP' && data.profession !== 'TOKEN';
      return isOperator && checkRarity[data.rarity] !== false;
    });
  },
};

export default FilterModel;
