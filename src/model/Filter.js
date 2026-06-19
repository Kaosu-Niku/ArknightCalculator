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
};

export default FilterModel;
