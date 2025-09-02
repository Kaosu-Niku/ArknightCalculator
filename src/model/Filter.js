import SkillCalculatorModel from './SkillCalculator';

const FilterModel = {
    // 數值過濾，將小數點無條件捨去
    numberFilter: (number) => {
        return Math.trunc(number);
    },

    // 通用資料過濾函式
    dataFilter: (data, checkRarity, professionCheck) => {
        let filteredData = [...data];

        // 過濾掉非幹員數據
        filteredData = filteredData.filter(item => {
            const profession = professionCheck(item)?.profession;
            return profession !== "TRAP" && profession !== "TOKEN";
        });

        // 過濾掉被取消勾選星級的數據
        const uncheckedRarities = Object.keys(checkRarity).filter(key => !checkRarity[key]);
        if (uncheckedRarities.length > 0) {
            filteredData = filteredData.filter(item => {
                const rarity = professionCheck(item)?.rarity;
                return !uncheckedRarities.includes(rarity);
            });
        }
        
        return filteredData;
    },

    // 幹員數據過濾
    characterDataFilter: (processedCharacterData, checkRarity) => {
        return FilterModel.dataFilter(processedCharacterData, checkRarity, (item) => item);
    },

    // 技能數據過濾
    skillDataFilter: (processedSkillData, characterJsonData, checkRarity) => {
        let filteredData = processedSkillData.filter(item => SkillCalculatorModel.skillFromMember(item, characterJsonData));
        return FilterModel.dataFilter(filteredData, checkRarity, (item) => SkillCalculatorModel.skillFromMember(item, characterJsonData));
    },
};

export default FilterModel;