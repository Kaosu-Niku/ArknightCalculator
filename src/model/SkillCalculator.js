import BasicCalculatorModel from '../model/BasicCalculator';
import MemberSpecial from './MemberSpecial';
import TalentsCalculatorModel from './TalentsCalculator';

const SkillCalculatorModel = {
  //查詢技能所屬的幹員數據 (回傳object，詳細內容參考character_table.json)
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

  //依照當前所選流派查詢幹員對應的最高等級技能數據 (回傳object，詳細內容參考skill_table.json)
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

  //依照指定key名嘗試查詢幹員對應的技能屬性，，並回傳此技能屬性的加成值 (若查詢不到則默認回傳0)
  skillAttribute: (type, skillrow, attribute) => {
    const skillData = SkillCalculatorModel.skillData(type, skillrow);
    return skillData.blackboard?.find(entry => entry.key === attribute)?.value ?? 0;
  },

  //計算幹員在技能期間的DPS
  skillMemberDps: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => {
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData);
    const memberTalent = TalentsCalculatorModel.talentListToAttackSkill(type, memberData)[memberData.name];
    const attackType = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).attackType;
    let dph = 0; 
    let finalDamage = 0;
    //攻擊乘算
    let attackMulti = SkillCalculatorModel.skillAttribute(type, skillRow, 'atk'); //技能倍率
    let talentAttackMulti = memberTalent?.atk || 0; //天賦倍率
    //攻擊倍率
    let attackScale = SkillCalculatorModel.skillAttribute(type, skillRow, 'atk_scale'); //技能倍率
    //需要判斷 > 0，確保原資料是0的時候不會計算出錯
    attackScale = attackScale > 0 ? attackScale : 1;
    let talentAttackScale = memberTalent?.atk_scale || 0; //天賦倍率   
    //傷害倍率
    let damageMulti = SkillCalculatorModel.skillAttribute(type, skillRow, 'damage_scale'); //技能倍率
    //需要判斷 > 0，確保原資料是0的時候不會計算出錯
    damageMulti = damageMulti > 0 ? damageMulti : 1
    let talentDamageMulti = memberTalent?.damage_scale || 0; //天賦倍率   
    
    switch(attackType){
      case "物理":
        //物理DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) - (敵人防禦 * (1 - 削減敵方防禦[比例]) - 削減敵方防禦[固定] - 無視防禦)) * 傷害倍率)
        
        //削減敵方防禦          
        let defDivide = SkillCalculatorModel.skillAttribute(type, skillRow, 'def'); //技能倍率
        //此數值在原遊戲數據同時有正數跟負數，正數是我方加防禦，負數才是削減敵方防禦，因此需要判斷 < 0
        //同時還要判斷值大小，絕對值 < 1 的值是比例值，絕對值 > 1 的值是固定值
        let defDivideA = 0; //比例
        let defDivideB = 0; //固定
        if(defDivide < 0){
          if(defDivide > -1){
            defDivideA = defDivide;
          }
          else{
            defDivideB = defDivide;
          }
        }
        let talentDefDivide = memberTalent?.def_penetrate_fixed || 0; //天賦倍率
        let talentDefDivideA = 0; //比例
        let talentDefDivideB = 0; //固定
        if(talentDefDivide < 0){
          if(talentDefDivide > -1){
            talentDefDivideA = talentDefDivide;
          }
          else{
            talentDefDivideB = talentDefDivide;
          }
        }
        
        //無視防禦
        let defSub = SkillCalculatorModel.skillAttribute(type, skillRow, 'def_penetrate_fixed'); //技能倍率

        //敵人剩餘防禦
        let finalEnemyDef = enemyData.enemyDef * (1 + defDivideA + talentDefDivideA) + defDivideB + talentDefDivideB - defSub;
        //需要判斷削弱防禦與無視防禦後的敵人剩餘防禦是否 < 0
        finalEnemyDef = finalEnemyDef < 0 ? 0 : finalEnemyDef;  

        finalDamage = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) - finalEnemyDef);
      break;
      case "法術":
        //法術DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) * ((100 - (敵人法抗 * (1 + 削減敵方法抗[比例]) + 削減敵方法抗[固定])) / 100)) * 傷害倍率)

        //削減敵方法抗       
        let resDivide = SkillCalculatorModel.skillAttribute(type, skillRow, 'magic_resistance'); //技能倍率
        //此數值在原遊戲數據同時有正數跟負數，正數是我方加法抗，負數才是削減敵方法抗，因此需要判斷 < 0
        //同時還要判斷值大小，絕對值 < 1 的值是比例值，絕對值 > 1 的值是固定值
        let resDivideA = 0; //比例
        let resDivideB = 0; //固定
        if(resDivide < 0){
          if(resDivide > -1){
            resDivideA = resDivide;
          }
          else{
            resDivideB = resDivide;
          }
        }       
        let talentResDivide = memberTalent?.magic_resistance || 0; //天賦倍率
        let talentResDivideA = 0; //比例
        let talentResDivideB = 0; //固定
        if(talentResDivide < 0){
          if(talentResDivide > -1){
            talentResDivideA = talentResDivide;
          }
          else{
            talentResDivideB = talentResDivide;
          }
        }

        //敵人剩餘法抗
        let finalEnemyRes = enemyData.enemyRes * (1 + resDivideA + talentResDivideA) + resDivideB + talentResDivideB;
        //需要判斷削弱法抗後的敵人剩餘法抗是否 < 0
        finalEnemyRes = finalEnemyRes < 0 ? 0 : finalEnemyRes;

        finalDamage = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) * ((100 - finalEnemyRes) / 100));
      break;     
    }

    //finalDamage是原定造成傷害，而傷害公式要確保傷害過低時會至少有5%攻擊力的保底傷害
    let ensureDamage = (memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) / 20;
    finalDamage = finalDamage < ensureDamage ? ensureDamage : finalDamage;
    dph = finalDamage * (damageMulti + talentDamageMulti);

    let attackTimeRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'base_attack_time'); //技能倍率
    let talentAttackTimeRevise = memberTalent?.base_attack_time || 0; //天賦倍率
    let attackSpeedRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'attack_speed'); //技能倍率
    let talentAttackSpeedRevise = memberTalent?.attack_speed || 0; //天賦倍率

    //最終攻擊間隔 = (幹員攻擊間隔 + 攻擊間隔調整) / ((幹員攻速 + 攻擊速度調整) / 100)
    let finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise + talentAttackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise + talentAttackSpeedRevise) / 100);

    
    //[攻擊次數]需要判斷 > 0 ，用於區分出固定次數傷害的技能
    let times = SkillCalculatorModel.skillAttribute(type, skillRow, 'times');
    if(times > 0){
      //對於這類技能，直接以總傷來表示DPS
      return dph * times;
    }
  
    return dph / finalAttackTime;
  },
  //計算幹員的技能總傷
  skillMemberTotal: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => { 
    const dps = SkillCalculatorModel.skillMemberDps(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData);
    let duration = SkillCalculatorModel.skillData(type, skillRow).duration;
    //[技能持續時間]需要判斷 < 1 ，確保強力擊、脫手類、永續類的技能不會計算錯誤
    duration = duration < 1 ? 1 : duration;

    //[攻擊次數]需要判斷 > 0 ，用於區分出固定次數傷害的技能 
    let times = SkillCalculatorModel.skillAttribute(type, skillRow, 'times');    
    if(times > 0){
      //對於這類技能，直接以得出的DPS來表示總傷
      return dps;
    }

    //[彈藥數量]需要判斷 > 0 ，用於區分出彈藥類的的技能
    let trigger_time = SkillCalculatorModel.skillAttribute(type, skillRow, 'attack@trigger_time');
    if(trigger_time > 0){
      //對於這類技能，重新計算最終攻擊間隔以回推出DPH，並乘上彈藥數量來計算總傷
      const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
      const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData);
      let attackTimeRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'base_attack_time');
      let attackSpeedRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'attack_speed');
      let finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise) / 100);
      return (dps * finalAttackTime) * trigger_time;
    }
    
    return dps * duration; 
  },
}

export default SkillCalculatorModel;
