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
  memberEquipData: (memberData, uniequipJsonData, customEquipid = null) => {
  let currentEquipData = undefined;

  const memberEquipID = UniequipCalculatorModel.memberEquipID(memberData, uniequipJsonData);
    if(memberEquipID){
      for (const id of memberEquipID) {
        if(memberData.equipid === id){ 
          currentEquipData = uniequipJsonData.equipDict[id];         
        }
      }

      if(customEquipid){
        //如果因為一些原因，參數memberData沒有辦法傳遞模組ID，替代方案於第三個參數手動添加模組ID以供查詢
        currentEquipData = uniequipJsonData.equipDict[customEquipid];   
      }
    }
    return currentEquipData;
  },

  //依照模組ID查詢幹員特定模組的實際數據 (object，詳細內容參考battle_equip_table.json)
  memberEquipBattle: (memberData, uniequipJsonData, battleEquipJsonData, customEquipid = null) => {
  let currentEquipBattle = undefined;
  let logObject = {};
  let log_equipid;
  let logCount_attributeBlackboard = 1;
  let logCount_blackboard = 1;
  let logCount_blackboard2 = 1;

  const memberEquipID = UniequipCalculatorModel.memberEquipID(memberData, uniequipJsonData);
    if(memberEquipID){
      for (const id of memberEquipID) {
        if(memberData.equipid === id){
          //模組基本上會有3個升級階段，但只需要取最高階段的來做數值計算
          currentEquipBattle = battleEquipJsonData[id].phases[battleEquipJsonData[id].phases.length - 1];
          log_equipid = memberData.equipid;
        }
      }

      if(customEquipid){
        //如果因為一些原因，參數memberData沒有辦法傳遞模組ID，替代方案於第三個參數手動添加模組ID以供查詢
        currentEquipBattle = battleEquipJsonData[customEquipid].phases[battleEquipJsonData[customEquipid].phases.length - 1];
        log_equipid = customEquipid;
      }

      if(currentEquipBattle){
        //log獲取基礎數值提升
        logObject['0.0. 模組ID'] = customEquipid ?? memberData.equipid;
        logObject['1.0. 基礎數值提升'] = '';
        for (const attributeBlackboard of currentEquipBattle.attributeBlackboard){
          logObject[`1.${logCount_attributeBlackboard}. ${attributeBlackboard.key}`] = attributeBlackboard.value;
          logCount_attributeBlackboard += 1;
        }

        //log獲取特性追加
        const partsObject = currentEquipBattle.parts.find(obj => 
          obj.overrideTraitDataBundle && obj.overrideTraitDataBundle.candidates !== null
        );
        const candidatesObject = partsObject.overrideTraitDataBundle.candidates[partsObject.overrideTraitDataBundle.candidates.length - 1];
        logObject['2.0. 特性追加描述'] = candidatesObject.additionalDescription;
        for (const blackboard of candidatesObject.blackboard){
          logObject[`2.${logCount_blackboard}. ${blackboard.key}`] = blackboard.value;
          logCount_blackboard += 1;
        }

        //log獲取天賦更新
        const partsObject2 = currentEquipBattle.parts.find(obj => 
          obj.addOrOverrideTalentDataBundle && obj.addOrOverrideTalentDataBundle.candidates !== null
        );
        const candidatesObject2 = partsObject2.addOrOverrideTalentDataBundle.candidates[partsObject2.addOrOverrideTalentDataBundle.candidates.length - 1];
        logObject['3.0. 天賦更新描述'] = candidatesObject2.upgradeDescription;
        for (const blackboard of candidatesObject2.blackboard){
          logObject[`3.${logCount_blackboard2}. ${blackboard.key}`] = blackboard.value;
          logCount_blackboard2 += 1;
        }    
        
        //打印log 
        if(memberData.name === CookieModel.getCookie('memberName')){  
          if(CookieModel.getLog('memberEquip_check').includes(log_equipid) === false){
            CookieModel.setLog('memberEquip', false);
            if(CookieModel.getLog('memberEquip') === false){
              CookieModel.setLog('memberEquip', true); 
              CookieModel.getLog('memberEquip_check').push(log_equipid);

              const equipData = UniequipCalculatorModel.memberEquipData(memberData, uniequipJsonData, log_equipid);
              console.log(
                `${memberData.name}的【${equipData.uniEquipName}】模組加成數據log`,
                logObject
              );
            }
          }
        }

      }
    }
    return currentEquipBattle;
  }
}

export default UniequipCalculatorModel;
