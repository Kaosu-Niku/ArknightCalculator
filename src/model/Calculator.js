import MemberSpecial from './MemberSpecial';

const Calculator = {
  // 當前流派
  type: (type) => {
    let witchPhases = 0;
    let witchAttributesKeyFrames = 0;

    switch(type){
      case '精零1級':
        witchPhases = 0;
        witchAttributesKeyFrames = 0;
      break;
      case '精零滿級':
        witchPhases = 0;
        witchAttributesKeyFrames = 1;
      break;
      case '精一1級':
        witchPhases = 1;
        witchAttributesKeyFrames = 0;
      break;
      case '精一滿級':
        witchPhases = 1;
        witchAttributesKeyFrames = 1;
      break;
      case '精二1級':
        witchPhases = 2;
        witchAttributesKeyFrames = 0;
      break;
      case '精二滿級':
        witchPhases = 2;
        witchAttributesKeyFrames = 1;
      break;
    }

    return { witchPhases: witchPhases, witchAttributesKeyFrames: witchAttributesKeyFrames,};
  },
  // 我方名稱
  memberNameRender: (memberRow) => {
    let newName = memberRow.name; 
    // 如果是四星隊，在名字後面標註模組
    if('mod' in memberRow){
      newName += `(${memberRow.mod})`;
    }
    return newName; 
  },
  // 我方星級
  memberRarity: (memberRow) => {
    const rarity = memberRow.rarity;
    switch(rarity){
      case "TIER_1":
        return "1";
      case "TIER_2":
        return "2";
      case "TIER_3":
        return "3";
      case "TIER_4":
        return "4";
      case "TIER_5":
        return "5";
      case "TIER_6":
        return "6";
    }
  },
  //我方職業
  memberProfession: (memberRow, professionJsonData) => {
    const profession = memberRow.profession;

  },
  //我方分支
  memberSubProfessionId: (memberRow, subProfessionIdJsonData) => {
    const subProfessionId = memberRow.subProfessionId;
    return subProfessionIdJsonData[subProfessionId]?.chineseName ?? "無";
  },
  // 我方當前數據
  memberData: (type, memberRow) => {
    const witchPhases = Calculator.type(type).witchPhases;
    const witchAttributesKeyFrames = Calculator.type(type).witchAttributesKeyFrames;
    const maxPhases = memberRow.phases.length;
    const data = memberRow.phases[witchPhases]?.attributesKeyFrames[witchAttributesKeyFrames]?.data ?? memberRow.phases[maxPhases - 1]?.attributesKeyFrames[1]?.data;
    return data;
  },
  // 我方DPH
  dph: (type, memberRow, enemyData) => {
    const attack = Calculator.memberData(type, memberRow).atk;
    let dph = 0;
    let attackType = "物傷";
    switch(attackType){
      case "物傷":
        dph = attack - enemyData.enemyDef;
        if(dph < attack / 20){
          dph = attack / 20;
        }
      break;
      case "法傷":
        dph = attack * ((100 - enemyData.enemyRes) / 100);
        if(dph < attack / 20){
          dph = attack / 20;
        }
      break;
    }
    return dph;
  },
  // 我方DPS
  memberDps: (type, memberRow, enemyData) => {
    const spd = Calculator.memberData(type, memberRow).baseAttackTime;
    const dps = Calculator.dph(type, memberRow, enemyData) / spd;
    return dps;//MemberSpecial.memberDpsSpecial(memberRow, enemyData, dps);
  },
  // 我方HPS
  memberHps: (memberRow) => {
    let hps = 0;
    switch(memberRow.attackType){
      case "治療":
        hps = memberRow.attack / memberRow.spd;
      break;
    }
    return MemberSpecial.memberHpsSpecial(memberRow, hps);
  },
  // 擊殺所需時間
  // memberKillTime: (memberRow, enemyData) => {
  //   let dps = Calculator.memberDps(memberRow, enemyData);  
  //   switch(memberRow.attackType){
  //     case "物傷":       
  //     return (Math.ceil(enemyData.enemyHp / dps));
  //     case "法傷":
  //     return (Math.ceil(enemyData.enemyHp / dps));
  //     default:
  //     return Infinity; // Infinity屬於number的一個值，此值必定會被視為最大值
  //   }
  // },
  // 敵方DPS
  enemyDps: (memberRow, enemyData) => {
    // 計算平A的DPS
    let dph = 0;
    let dps = 0;      
    switch(enemyData.enemyAttackType){
      case "物傷":
        dph = enemyData.enemyAttack - memberRow.def;
        if(dph < enemyData.enemyAttack / 20){
          dph = enemyData.enemyAttack / 20;
        }
        dps = (dph / enemyData.enemySpd);
      break;
      case "法傷":
        dph = enemyData.enemyAttack * ((100 - memberRow.res) / 100);
        if(dph < enemyData.enemyAttack / 20){
          dph = enemyData.enemyAttack / 20;
        } 
        dps = (dph / enemyData.enemySpd);
      break;
      case "真傷":
        dps = (enemyData.enemyAttack / enemyData.enemySpd);
      break;
      default:
        dps = 0;
      break;
    }   
    // 計算技能的DPS
    let skillDph = 0;
    let skillDps = 0;
    let skillDpsTotal = 0;
    if(enemyData.enemySkill.length > 0){
      enemyData.enemySkill.forEach((item) => {
        switch(item.enemySkillType){
          case "物傷":
            skillDph = item.enemySkillDamage - memberRow.def;
            if(skillDph < item.enemySkillDamage / 20){
              skillDph = item.enemySkillDamage / 20;              
            }  
          break;
          case "法傷":
            skillDph = item.enemySkillDamage * ((100 - memberRow.res) / 100);
            if(skillDph < item.enemySkillDamage / 20){
              skillDph = item.enemySkillDamage / 20;              
            }     
          break;
          case "真傷":
            skillDph = item.enemySkillDamage;
          break;
          default:
            skillDph = 0;
          break;
        }
        skillDps = ((skillDph * item.enemySkillCount) / item.enemySkillWaitTime);
        skillDpsTotal += skillDps;
      });
    }
    return dps + skillDpsTotal;
  },
  // 技能期間我方數值
  skillMemberRow: (skillRow, memberJsonData) => {
    let memberRow = memberJsonData.find(item => item.name === skillRow.name);
    let copyMemberRow = JSON.parse(JSON.stringify(memberRow));
    switch(skillRow.skillType){
      case "攻擊":   
        // 最終攻擊力 = (((原始攻擊力 + 直接固定加算) * 直接倍率乘算) + 最終固定加算) * 最終倍率乘算
        let finalAttack = (((memberRow.attack + skillRow.skillFirstAdd) * skillRow.skillFirtsMultiply) + skillRow.skillLastAdd) * skillRow.skillLastMultiply; 
        // 最終攻速 = (原始攻擊間隔 - 攻擊間隔縮短時間) / ((100 + 攻速提升) / 100)
        // 需注意(100 + 攻速提升)的最終值最小不低於20，最大不高於600
        let finalSpd = (memberRow.spd - skillRow.spdAdd) / ((100 + Math.max(-80, Math.min(500, skillRow.spdMultiply))) / 100);
        // 改變後的攻擊力和攻擊間隔可能不是整數，攻擊力和攻擊間隔直接取至小數點後兩位
        copyMemberRow.attack = finalAttack.toFixed(2);
        copyMemberRow.spd = finalSpd.toFixed(2);
      break;
      case "防禦":  
        // 最終防禦力 = (((原始防禦力 + 直接固定加算) * 直接倍率乘算) + 最終固定加算) * 最終倍率乘算
        let finalDef = (((memberRow.def + skillRow.skillFirstAdd) * skillRow.skillFirtsMultiply) + skillRow.skillLastAdd) * skillRow.skillLastMultiply;
        // 改變後的防禦力可能不是整數，防禦力直接取至小數點後兩位
        copyMemberRow.def = finalDef.toFixed(2);
        // 角峰的二技能加法抗太破壞公式，只能獨立處理
        if(copyMemberRow.name == '角峰' && skillRow.whichSkill.includes('二技能')){
          if('mod' in skillRow){
            // Y模組加更多基礎法抗
            copyMemberRow.res = 25 * 2;
          }    
          else{
            copyMemberRow.res = 12 * 1.7;
          }
        } 
      break;
      case "治療":  
        // 最終攻擊力 = (((原始攻擊力 + 直接固定加算) * 直接倍率乘算) + 最終固定加算) * 最終倍率乘算
        let finalAttackH = (((memberRow.attack + skillRow.skillFirstAdd) * skillRow.skillFirtsMultiply) + skillRow.skillLastAdd) * skillRow.skillLastMultiply; 
        // 最終攻速 = (原始攻擊間隔 - 攻擊間隔縮短時間) / ((100 + 攻速提升) / 100)
        // 需注意(100 + 攻速提升)的最終值最小不低於20，最大不高於600
        let finalSpdH = (memberRow.spd - skillRow.spdAdd) / ((100 + Math.max(-80, Math.min(500, skillRow.spdMultiply))) / 100);
        // 改變後的攻擊力和攻擊間隔可能不是整數，攻擊力和攻擊間隔直接取至小數點後兩位
        copyMemberRow.attack = finalAttackH.toFixed(2);
        copyMemberRow.spd = finalSpdH.toFixed(2); 
        // 由於有些技能期間屬於治療技能的幹員其本身不屬於奶媽，因此需要修改特定資料後才能使得後續能計算出HPS
        copyMemberRow.attackType = "治療";
      break;
    }
    return copyMemberRow;
  },
  // 技能期間我方DPS
  skillMemberDps: (skillRow, memberJsonData, enemyData) => {
    const newMemberRow = Calculator.skillMemberRow(skillRow, memberJsonData);
    let dph = 0;
    let dps = 0;
    if(skillRow.skillTime !== -1){
      // 正常類型技能
      dps = Calculator.memberDps(newMemberRow, enemyData);      
    }
    else{
      // 強力擊類型技能
      dph = Calculator.dph(newMemberRow, enemyData);
      dps = (dph / skillRow.waitTime);
    }
    // 刻刀一技能算法太破壞公式，只能獨立處理
    if(newMemberRow.name == '刻刀' && skillRow.whichSkill.includes('一技能')){
      dps = ((dph * 4) / skillRow.waitTime);
    }
    return dps;
  },
  // 技能期間我方HPS
  skillMemberHps: (skillRow, memberJsonData, enemyData) => {
    const newMemberRow = Calculator.skillMemberRow(skillRow, memberJsonData);
    let hps = 0;
    if(skillRow.skillTime !== -1){
      // 正常類型技能
      hps = Calculator.memberHps(newMemberRow);      
    }
    else{
      // 強力擊類型技能
      hps = (newMemberRow.attack / skillRow.waitTime);
    }
    // 正常奶媽的特殊計算(先計算所有正常奶媽的HPS)
    let newHps = MemberSpecial.memberHpsSpecial(newMemberRow, hps);
    // 非正常奶媽的特殊計算(後計算所有非正常奶媽的HPS，而正常奶媽的HPS會直接回傳原值)
    return MemberSpecial.defSkillHpsSpecial(newMemberRow, skillRow, enemyData, newHps);
  },
  // 技能總傷
  memberSkillTotal: (skillRow, memberJsonData, enemyData) => { 
    const newMemberRow = Calculator.skillMemberRow(skillRow, memberJsonData);
    let dps = 0;
    let dph = 0;
    let total = 0;
    if(skillRow.skillTime !== -1){
      // 正常類型技能
      dps = Calculator.memberDps(newMemberRow, enemyData);
      total = dps * skillRow.skillTime;
    }
    else{
      // 強力擊類型技能
      dph = Calculator.dph(newMemberRow, enemyData);
      total = dph;
    } 
    // 刻刀的一技能算法太破壞公式，只能獨立處理
    if(newMemberRow.name == '刻刀' && skillRow.whichSkill.includes('一技能')){
      total = dph * 4;
    } 
    return total; 
  },
}

export default Calculator;
