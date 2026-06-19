import BasicCalculatorModel from '../../model/BasicCalculator';
import FilterModel from '../../model/Filter';
import UniequipCalculatorModel from '../../model/UniequipCalculator';

const createMemberColumns = ({
  t,
  whichType,
  professionJsonData,
  subProfessionIdJsonData,
  uniequipJsonData,
  battleEquipJsonData,
}) => {
  const numericCache = new WeakMap();

  const getNumeric = (row) => {
    const cached = numericCache.get(row);
    if(cached){
      return cached;
    }

    const numeric = BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData);
    numericCache.set(row, numeric);
    return numeric;
  };

  return [
    { title: t("名稱"), data: "name", render: function (data) { return t(data, 'zh-CN'); } },
    { title: t("星級"), data: "rarity", render: function (data, type, row) { return BasicCalculatorModel.memberRarity(row); } },
    { title: t("職業"), data: "profession", render: function (data, type, row) { return t(BasicCalculatorModel.memberProfession(row, professionJsonData).chineseName, 'zh-TW'); } },
    { title: t("分支"), data: "subProfessionId", render: function (data, type, row) { return t(BasicCalculatorModel.memberSubProfessionId(row, subProfessionIdJsonData).chineseName, 'zh-TW'); } },
    { title: t("模組"), data: "equipid",
      render: function (data, type, row) {
        const equipData = UniequipCalculatorModel.memberEquipData(row, uniequipJsonData);
        if(equipData){
            return t(equipData.uniEquipName, 'zh-CN');
        }
        else{
          return `${t(row.name, 'zh-CN')}${t('证章', 'zh-CN')}`;
        }
      }
    },
    { title: t("生命"), data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(getNumeric(row).maxHp); } },
    { title: t("傷害類型"), data: null, render: function (data, type, row) { return t(BasicCalculatorModel.memberSubProfessionId(row, subProfessionIdJsonData).attackType, 'zh-TW'); } },
    { title: t("攻擊"), data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(getNumeric(row).atk); } },
    { title: t("防禦"), data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(getNumeric(row).def); } },
    { title: t("法抗"), data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(getNumeric(row).magicResistance); } },
    { title: t("攻擊間隔"), data: "phases", render: function (data, type, row) { return getNumeric(row).baseAttackTime; } },
    { title: t("攻速"), data: "phases", render: function (data, type, row) { return FilterModel.numberFilter(getNumeric(row).attackSpeed); } },
  ];
};

export default createMemberColumns;
