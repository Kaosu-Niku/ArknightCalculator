import BasicCalculatorModel from '../model/BasicCalculator';
import SkillCustomCalculatorModel from './SkillCustomCalculator';
import TalentsCalculatorModel from './TalentsCalculator';
import TalentsCustomCalculatorModel from './TalentsCustomCalculator';
import CookieModel from './Cookie';

const UniequipCalculatorModel = {
  //查詢幹員擁有的所有模組的ID (回傳string array，詳細內容參考uniequip_table.json的charEquip)
  memberEquipID: (memberData, uniequipJsonData) => {
    //幹員數據的potentialItemId的格式是: p_char_[數字]_[英文名稱]
    //模組數據的ID的格式是: char_[數字]_[英文名稱]
    //因此在比對id查詢之前，先刪除前面的p_兩字    
    const memberId = memberData.potentialItemId?.substring(2);
    const currentCharEquip = uniequipJsonData.charEquip[memberId];
    //若無任何模組會回傳undefind
    return currentCharEquip;
  },

  //查詢幹員擁有的所有模組的資訊 (回傳object array，每個object都對應到一個uniequip_table.json的equipDict的資料)
  memberEquipData: (memberData, uniequipJsonData) => {
  const equipDataList = [];
  const memberEquipID = UniequipCalculatorModel.memberEquipID(memberData, uniequipJsonData);

    if(memberEquipID !== undefined){
      for (const id of memberEquipID) {
        const currentData = uniequipJsonData.equipDict[id];
        if(currentData !== undefined){
          equipDataList.push(currentData);
        }
      }
      return equipDataList;
    }
    else{
      return undefined;
    }
  },

  //查詢幹員擁有的所有模組的實際數據 (回傳object array，每個object都對應到一個battle_equip_table.json的資料)
  memberEquipBattle: (memberData, uniequipJsonData, battleEquipJsonData) => {
  const equipBattleList = [];
  const memberEquipID = UniequipCalculatorModel.memberEquipID(memberData, uniequipJsonData);

    if(memberEquipID !== undefined){
      for (const id of memberEquipID) {
        const currentBattle = battleEquipJsonData[id];
        if(currentBattle !== undefined){
          equipBattleList.push(currentBattle);
        }
      }
      return equipBattleList;
    }
    else{
      return undefined;
    }
  }
}

export default UniequipCalculatorModel;
