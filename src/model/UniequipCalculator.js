import BasicCalculatorModel from '../model/BasicCalculator';
import { logCalculationDetails } from './LogHelper';
import CookieModel from './Cookie';

const UniequipCalculatorModel = {
  // Queries for all module IDs the operator has (returns string array, see uniequip_table.json charEquip for details)
  memberEquipID: (memberData, uniequipJsonData) => {
    const memberId = memberData.potentialItemId?.substring(2);
    return uniequipJsonData.charEquip[memberId];
  },

  // Queries for a specific module's info by module ID (returns an object, see uniequip_table.json equipDict for details)
  memberEquipData: (memberData, uniequipJsonData, customEquipid = null) => {
    const equipId = customEquipid || memberData.equipid;
    if (!equipId) return undefined;
    
    const memberEquipIDs = UniequipCalculatorModel.memberEquipID(memberData, uniequipJsonData);
    if (memberEquipIDs && memberEquipIDs.includes(equipId)) {
      return uniequipJsonData.equipDict[equipId];
    }
    return undefined;
  },

  // Queries for a specific module's actual data by module ID (object, see battle_equip_table.json)
  memberEquipBattle: (memberData, uniequipJsonData, battleEquipJsonData, customEquipid = null) => {
    const equipId = customEquipid || memberData.equipid;
    if (!equipId || !battleEquipJsonData[equipId]) return undefined;

    const equipBattleData = battleEquipJsonData[equipId];
    const latestPhase = equipBattleData.phases[equipBattleData.phases.length - 1];
    
    // Log data
    const equipData = UniequipCalculatorModel.memberEquipData(memberData, uniequipJsonData, equipId);
    const logObject = {};
    logObject['0.0. 模組ID'] = equipId;
    
    const addLogSection = (label, dataArray, keyProp, valueProp) => {
      if (!dataArray) return;
      logObject[label] = '';
      dataArray.forEach((item, index) => {
        logObject[`${label.split('. ')[0]}.${index + 1}. ${item[keyProp]}`] = item[valueProp];
      });
    };
    
    addLogSection('1.0. 基礎數值提升', latestPhase.attributeBlackboard, 'key', 'value');
    
    const traitPart = latestPhase.parts.find(p => p.overrideTraitDataBundle?.candidates);
    if (traitPart) {
      const traitCandidate = traitPart.overrideTraitDataBundle.candidates.slice(-1)[0];
      logObject['2.0. 特性追加描述'] = traitCandidate.additionalDescription;
      addLogSection('2.0. 特性追加', traitCandidate.blackboard, 'key', 'value');
    }
    
    const talentPart = latestPhase.parts.find(p => p.addOrOverrideTalentDataBundle?.candidates);
    if (talentPart) {
      const talentCandidate = talentPart.addOrOverrideTalentDataBundle.candidates.slice(-1)[0];
      logObject['3.0. 天賦更新描述'] = talentCandidate.upgradeDescription;
      addLogSection('3.0. 天賦更新', talentCandidate.blackboard, 'key', 'value');
    }

    //logCalculationDetails('memberEquip', memberData.name, { equipid: equipId }, null, null, null, null, logObject);
    
    return latestPhase;
  },

  // Queries for the module's sub-profession trait bonus
  memberEquipTrait: (equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, candidates_check, subProfession, attributeKey) => {
    const memberEquipBattle = UniequipCalculatorModel.memberEquipBattle(memberData, uniequipJsonData, battleEquipJsonData, equipid);
    const blackboardList = memberEquipBattle?.parts.find(p => p.overrideTraitDataBundle?.candidates)?.overrideTraitDataBundle.candidates.slice(-1)[0].blackboard;
    
    const getTraitValue = (key) => blackboardList?.find(item => item.key === key)?.value;
    
    // Unconditional traits
    const unconditionalTraits = {
      '解放者': { 'atk': 2, 'atk_scale': 1, 'damage_scale': 1, 'def_penetrate_fixed': 0, 'magic_resist_penetrate_fixed': 0, 'attack_speed': 0, 'other2_attack_scale': 0, 'other2_attack_type': 0, 'enable_third_attack': 0 },
      '散射手': { 'atk_scale': getTraitValue('atk_scale') ?? 1.5 },
      '御械術師': { 'other2_attack_scale': getTraitValue('max_atk_scale') ?? 1.1, 'other2_attack_type': '法術' },
      '投擲手': { 'other2_attack_scale': getTraitValue('attack@append_atk_scale') ?? 0.5, 'other2_attack_type': '物理', 'enable_third_attack': getTraitValue('attack@enable_third_attack') ?? 0 },
      '領主': { 'other2_attack_scale': getTraitValue('atk_scale_m') ?? 0, 'other2_attack_type': '法術' },
      '劍豪': { 'damage_scale': getTraitValue('damage_scale') ?? 1, 'def_penetrate_fixed': getTraitValue('def_penetrate_fixed') ?? 0 },
      '炮手': { 'def_penetrate_fixed': getTraitValue('def_penetrate_fixed') ?? 0 },
      '中堅術師': { 'magic_resist_penetrate_fixed': getTraitValue('magic_resist_penetrate_fixed') ?? 0 },
      '要塞': { 'attack_speed': getTraitValue('attack_speed') ?? 0 },
    };
    
    // Conditional traits
    if (candidates_check) {
      unconditionalTraits['尖兵'] = { 'atk': getTraitValue('atk') ?? 0 };
      unconditionalTraits['吟遊者'] = { 'atk': getTraitValue('atk') ?? 0 };
      unconditionalTraits['處決者'] = { 'atk': getTraitValue('atk') ?? 0 };
      unconditionalTraits['行商'] = { 'atk': (getTraitValue('atk') * getTraitValue('max_stack_cnt')) ?? 0 };
      unconditionalTraits['衝鋒手'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1 };
      unconditionalTraits['戰術家'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1 };
      unconditionalTraits['無畏者'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1, 'attack_speed': getTraitValue('attack_speed') ?? 0 };
      unconditionalTraits['強攻手'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1 };
      unconditionalTraits['教官'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1 };
      unconditionalTraits['速射手'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1, 'attack_speed': getTraitValue('attack_speed') ?? 0 };
      unconditionalTraits['攻城手'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1, 'damage_scale': (1 + (getTraitValue('damage_scale') ?? 0.12)) };
      unconditionalTraits['炮手'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1 };
      unconditionalTraits['塑靈術師'] = { 'atk_scale': getTraitValue('atk_scale') ?? 1 };
      unconditionalTraits['撼地者'] = { 'atk_scale': getTraitValue('atk_scale_e') ?? 1 };
      unconditionalTraits['術戰者'] = { 'damage_scale': getTraitValue('damage_scale') ?? 1, 'attack_speed': getTraitValue('attack_speed') ?? 0 };
      unconditionalTraits['神射手'] = { 'damage_scale': (1 + (getTraitValue('damage_scale') ?? 0.15)) };
      unconditionalTraits['轟擊術師'] = { 'damage_scale': (1 + (getTraitValue('damage_scale') ?? 0.15)) };
      unconditionalTraits['陣法術師'] = { 'damage_scale': (1 + (getTraitValue('damage_scale') ?? 0.15)) };
      unconditionalTraits['鬥士'] = { 'attack_speed': getTraitValue('attack_speed') ?? 0 };
      unconditionalTraits['領主'] = { 'attack_speed': getTraitValue('attack_speed') ?? 0 };
      unconditionalTraits['秘術師'] = { 'attack_speed': getTraitValue('attack_speed') ?? 0 };
    }
    
    if (witchPhases < 2) {
      unconditionalTraits['散射手'] = { 'atk_scale': 1.5 };
      unconditionalTraits['御械術師'] = { 'other2_attack_scale': 1.1, 'other2_attack_type': '法術' };
      unconditionalTraits['投擲手'] = { 'other2_attack_scale': 0.5, 'other2_attack_type': '物理' };
    }
    
    return unconditionalTraits[subProfession]?.[attributeKey];
  },

  // Queries for the module's talent update
  memberEquipTalent: (equipid, memberData, uniequipJsonData, battleEquipJsonData, witchPhases, attributeKey) => {
    if (witchPhases < 2) return undefined;
    
    const memberEquipBattle = UniequipCalculatorModel.memberEquipBattle(memberData, uniequipJsonData, battleEquipJsonData, equipid);
    const blackboardList = memberEquipBattle?.parts.find(p => p.addOrOverrideTalentDataBundle?.candidates)?.addOrOverrideTalentDataBundle.candidates.slice(-1)[0].blackboard;

    return blackboardList?.find(item => item.key === attributeKey)?.value;
  },
};

export default UniequipCalculatorModel;