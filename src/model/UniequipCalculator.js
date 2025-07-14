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

  //依照模組ID查詢幹員特定模組的資訊 (回傳object，詳細內容參考uniequip_table.json的equipDict)
  memberEquipData: (memberData, uniequipJsonData) => {
  const memberEquipID = UniequipCalculatorModel.memberEquipID(memberData, uniequipJsonData);
    if(memberEquipID){
      for (const id of memberEquipID) {
        if(memberData.equipid === id){          
          return uniequipJsonData.equipDict[id];
        }
      }
    }
    return undefined;
  },

  //依照模組ID查詢幹員特定模組的實際數據 (object，詳細內容參考battle_equip_table.json)
  memberEquipBattle: (memberData, uniequipJsonData, battleEquipJsonData, customEquipid = null) => {
  const memberEquipID = UniequipCalculatorModel.memberEquipID(memberData, uniequipJsonData);
    if(memberEquipID){
      for (const id of memberEquipID) {
        if(memberData.equipid === id){
          //模組基本上會有3個升級階段，但只需要取最高階段的來做數值計算
          const currentEquipBattle = battleEquipJsonData[id];
          return currentEquipBattle.phases[currentEquipBattle.phases.length - 1];
        }
      }
      if(customEquipid){
        //如果因為一些原因，參數memberData沒有辦法傳遞模組ID，替代方案於第三個參數手動添加模組ID以供查詢
        const currentEquipBattle = battleEquipJsonData[customEquipid];
        return currentEquipBattle.phases[currentEquipBattle.phases.length - 1];
      }
    }
    return undefined;
  }
}

export default UniequipCalculatorModel;
