import {
  getBaseSubProfessionTrait,
  getConditionalModuleTrait,
  getStaticModuleTrait,
} from './uniequipTraitRules';
import UniequipDataIndexModel from './UniequipDataIndex';

const UniequipCalculatorModel = {
  // potentialItemId 去除 p_ 後即為 uniequip_table.charEquip 的角色 key。
  memberEquipID: (memberData, uniequipJsonData) => {
    const memberId = memberData.potentialItemId?.substring(2);
    const currentCharEquip = uniequipJsonData.charEquip[memberId];
    return currentCharEquip;
  },

  memberEquipData: (memberData, uniequipJsonData, customEquipid = null) => {
    const equipid = customEquipid ?? memberData?.equipid;
    const memberEquipID = UniequipCalculatorModel.memberEquipID(memberData, uniequipJsonData);
    if(memberEquipID){
      if(customEquipid){
        return uniequipJsonData.equipDict[customEquipid];
      }

      if(equipid && memberEquipID.includes(equipid)){
        return uniequipJsonData.equipDict[equipid];
      }
    }
    return undefined;
  },

  memberEquipBattle: (memberData, uniequipJsonData, battleEquipJsonData, customEquipid = null) => {
    return UniequipDataIndexModel.resolve(
      memberData,
      uniequipJsonData,
      battleEquipJsonData,
      customEquipid
    ).battlePhase;
  },

  // 分支基礎特性、模組強化與可選條件效果統一由規則表解析。
  memberEquipTrait: (equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfession, attributeKey) => {
    if(witchPhases === 2){
      const uniequipData = UniequipDataIndexModel.resolve(
        memberData,
        uniequipJsonData,
        battleEquipJsonData,
        equipid
      );
      const blackboard = {
        value: (key) => uniequipData.traitBlackboard.get(key),
      };
      const staticTrait = getStaticModuleTrait(subProfession, attributeKey, blackboard);
      if(staticTrait !== undefined){
        return staticTrait;
      }

      if(candidates_check){
        const conditionalTrait = getConditionalModuleTrait(subProfession, attributeKey, blackboard);
        if(conditionalTrait !== undefined){
          return conditionalTrait;
        }
      }
    }else{
      const baseTrait = getBaseSubProfessionTrait(subProfession, attributeKey);
      if(baseTrait !== undefined){
        return baseTrait;
      }
    }

    return undefined;
  },

  memberEquipTalent: (equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, attributeKey) => {    
    if(witchPhases === 2){
      const uniequipData = UniequipDataIndexModel.resolve(
        memberData,
        uniequipJsonData,
        battleEquipJsonData,
        equipid
      );
      return uniequipData.talentBlackboard.get(attributeKey);
    }
    else{
      return undefined;
    }
  }
}

export default UniequipCalculatorModel;
