import BasicCalculatorModel from '../model/BasicCalculator';
import MemberSpecial from './MemberSpecial';

const SkillCalculatorModel = {
  //技能所屬的幹員數據
  skillFromMember: (skillrow, characterJsonData) => {
    const skillId = skillrow.skillId;
    let checkSkill = false;
    
    //遍歷所有幹員數據，並查詢技能數據中技能Id相符的幹員數據並回傳
    for (const key in characterJsonData) {
      if (characterJsonData.hasOwnProperty(key)){
        const currentCharacter = characterJsonData[key];
        checkSkill = currentCharacter.skills.some((item) => {
          return item.skillId == skillId
        });
        if(checkSkill == true){
          return currentCharacter;
        }
      }
    }   
    return null;
  },

  //最高的技能數據
  skillData: (type, skillrow) => {
    //流派
    const witchPhases = BasicCalculatorModel.type(type).witchPhases;
    const witchAttributesKeyFrames = BasicCalculatorModel.type(type).witchAttributesKeyFrames;
    const maxLevel = skillrow.levels.length; //3星以下幹員的技能沒有辦法專精，技能只能到7級，此用於輔助判斷

    if(maxLevel > 7){
        //四星以上的幹員
        switch(witchPhases){
          case 0: //精零
            return skillrow.levels[maxLevel - 7];
          case 1: //精一
            return skillrow.levels[maxLevel - 4];
          case 2: //精二
            return skillrow.levels[maxLevel - 1];
        }
      }
      else{
        //三星以下的幹員
        switch(witchPhases){
          case 0: //精零
            return skillrow.levels[maxLevel - 4];
          case 1: //精一
            return skillrow.levels[maxLevel - 1];
          case 2: //精二
            return skillrow.levels[maxLevel - 1];
        }
      }
    
  },

  //技能屬性加成
  skillAttribute: (type, skillrow, attribute) => {
    const skillData = SkillCalculatorModel.skillData(type, skillrow);
    return skillData.blackboard?.find(entry => entry.key === attribute)?.value ?? 0;
  },

  // 技能期間我方DPS
  skillMemberDps: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => {
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData);

    const attackType = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).attackType;
    let dph = 0;
    let attackMulti = SkillCalculatorModel.skillAttribute(type, skillRow, 'atk');
    let attackScale = SkillCalculatorModel.skillAttribute(type, skillRow, 'atk_scale');
    //[攻擊倍率]需要判斷是否 > 0，確保原資料是0的不會跟著變成0
    attackScale = attackScale > 0 ? attackScale : 1;
    let damageMulti = SkillCalculatorModel.skillAttribute(type, skillRow, 'damage_scale');
    let finalDamage = 0

    switch(attackType){
      case "物理":
        //物理DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) - (敵人防禦 * (1 - 削減敵方防禦[比例]) - 削減敵方防禦[固定] - 無視防禦)) * 傷害倍率)
        
        //[削減敵方防禦]需要判斷 < 0 才是削減敵人，若 > 0 是我方加防禦    
        let defDivide = SkillCalculatorModel.skillAttribute(type, skillRow, 'def') < 0 ? SkillCalculatorModel.skillAttribute(type, skillRow, 'def') : 0;
        //再判斷值大小，通常來說絕對值 < 1 的值是比例值，而絕對值 > 1 的值是固定值
        let defDivideA = 0; //比例
        let defDivideB = 0; //固定
        if(defDivide > -1){
          defDivideA = defDivide;
        }
        else{
          defDivideB = defDivide;
        }
        let defSub = SkillCalculatorModel.skillAttribute(type, skillRow, 'def_penetrate_fixed');
        let finalEnemyDef = enemyData.enemyDef * (1 + defDivideA) + defDivideB - defSub;
        //需要判斷削弱防禦與無視防禦後的剩餘防禦是否 < 0
        finalEnemyDef = finalEnemyDef < 0 ? 0 : finalEnemyDef;          
        finalDamage = ((memberNumeric.atk * (1 + attackMulti) * attackScale) - finalEnemyDef);
      break;
      case "法術":
        //法術DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) * ((100 - 敵人法抗) / 100)) * 傷害倍率)

        //[削減敵方法抗]需要判斷 < 0 才是削減敵人，若 > 0 是我方加法抗  
        let resDivide = SkillCalculatorModel.skillAttribute(type, skillRow, 'magic_resistance') < 0 ? SkillCalculatorModel.skillAttribute(type, skillRow, 'magic_resistance') : 0;
        //再判斷值大小，通常來說絕對值 < 1 的值是比例值，而絕對值 > 1 的值是固定值
        let resDivideA = 0; //比例
        let resDivideB = 0; //固定
        if(resDivide > -1){
          resDivideA = resDivide;
        }
        else{
          resDivideB = resDivide;
        }
        let finalEnemyRes = enemyData.enemyRes * (1 + resDivideA) + resDivideB;
        //需要判斷削弱法抗後的剩餘法抗是否 < 0
        finalEnemyRes = finalEnemyRes < 0 ? 0 : finalEnemyRes;
        finalDamage = ((memberNumeric.atk * (1 + attackMulti) * attackScale) * ((100 - finalEnemyRes) / 100));
      break;     
    }

    //finalDamage是原定造成傷害，而傷害公式會確保傷害過低時會至少有5%保底傷害
    finalDamage = finalDamage < memberNumeric.atk / 20 ? memberNumeric.atk / 20 : finalDamage;
    //[傷害倍率]需要判斷是否 > 0，確保原資料是0的不會跟著變成0
    damageMulti = damageMulti > 0 ? damageMulti : 1
    dph = finalDamage * damageMulti;

    let attackTimeRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'base_attack_time');
    let attackSpeedRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'attack_speed');

    //最終攻擊間隔 = (幹員攻擊間隔 + 攻擊間隔調整) / ((幹員攻速 + 攻擊速度加算) / 100)
    let finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise) / 100);

    let times = SkillCalculatorModel.skillAttribute(type, skillRow, 'times');
    //[攻擊次數]需要判斷是否 > 0 ，用於區分出固定次數傷害或彈藥類的技能
    if(times > 0){
      //對於這類技能，直接以總傷來表示DPS
      return dph * times;
    }
    else{
      return dph / finalAttackTime; 
    } 
    
  },
  // 技能總傷
  skillMemberTotal: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => { 
    const dps = SkillCalculatorModel.skillMemberDps(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData);
    let duration = SkillCalculatorModel.skillData(type, skillRow).duration;
    //[技能持續時間]需要判斷是否 < 1 ，確保強力擊、脫手類、永續類的技能不會計算錯誤
    duration = duration < 1 ? 1 : duration;
    let times = SkillCalculatorModel.skillAttribute(type, skillRow, 'times');
    //[攻擊次數]需要判斷是否 > 0 ，用於區分出固定次數傷害或彈藥類的技能  
    if(times > 0){
      //對於這類技能，直接以DPS來表示總傷
      return dps;
    }
    else{
      return dps * duration; 
    } 
  },
}

export default SkillCalculatorModel;
