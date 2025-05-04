import MemberSpecial from './MemberSpecial';

const Calculator = {
  // 我方名稱
  memberNameRender: (row) => {
    let newName = row.name; 
    // 如果是四星隊，在名字後面標註模組
    if('mod' in row){
      newName += `(${row.mod})`;
    }
    return newName; 
  },
  // 我方說明文字
  memberDirection: (row, directionsJsonData) => {
    let memberRow = directionsJsonData.Basic.find(item => item.name === row.name);
    return memberRow.direction;
  },
  // 我方DPH
  dph: (memberRow, enemyData) => {
    let dph = 0;
    switch(memberRow.attackType){
      case "物傷":
        dph = memberRow.attack - enemyData.enemyDef;
        if(dph < memberRow.attack / 20){
          dph = memberRow.attack / 20;
        }
      break;
      case "法傷":
        dph = memberRow.attack * ((100 - enemyData.enemyRes) / 100);
        if(dph < memberRow.attack / 20){
          dph = memberRow.attack / 20;
        }
      break;
    }
    return dph;
  },
  // 我方DPS
  memberDps: (memberRow, enemyData) => {
    let dps = Calculator.dph(memberRow, enemyData) / memberRow.spd;
    return MemberSpecial.memberDpsSpecial(memberRow, enemyData, dps);
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
