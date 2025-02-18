import MemberSpecial from './MemberSpecial';

const Calculator = {
  // 我方DPS
  memberDps: (memberRow, enemyData) => {
    let finalDamage = 0;
    let finalDps = 0;
    switch(memberRow.attackType){
      case "物傷":
        finalDamage = memberRow.attack - enemyData.enemyDef;
        if(finalDamage < memberRow.attack / 20){
          finalDamage = memberRow.attack / 20;
        }
        finalDps = (finalDamage / memberRow.spd).toFixed(2);        
      return MemberSpecial.memberDpsSpecial(memberRow, enemyData, finalDps);
      case "法傷":
        finalDamage = memberRow.attack * ((100 - enemyData.enemyRes) / 100);
        if(finalDamage < memberRow.attack / 20){
          finalDamage = memberRow.attack / 20;
        }
        finalDps = (finalDamage / memberRow.spd).toFixed(2);
      return MemberSpecial.memberDpsSpecial(memberRow, enemyData, finalDps);
      default:
      return 0;
    }
  },
  // 我方HPS
  memberHps: (memberRow) => {
    switch(memberRow.attackType){
      case "治療":
        let finalHps = (memberRow.attack / memberRow.spd).toFixed(2);
      return MemberSpecial.memberHpsSpecial(memberRow, finalHps);
      default:
      return 0;
    }
  },
  // 擊殺所需時間
  memberKillTime: (memberRow, enemyData) => {
    let dps = Calculator.memberDps(memberRow, enemyData);  
    switch(memberRow.attackType){
      case "物傷":       
      return (Math.ceil(enemyData.enemyHp / dps));
      case "法傷":
      return (Math.ceil(enemyData.enemyHp / dps));
      default:
      return Infinity; // Infinity屬於number的一個值，此值必定會被視為最大值
    }
  },
  // 敵方DPS
  enemyDps: (memberRow, enemyData) => {
    // 計算平A的DPS
    let attackDamage = 0;
    let attackDps = 0;      
    switch(enemyData.enemyAttackType){
      case "物傷":
        attackDamage = enemyData.enemyAttack - memberRow.def;
        if(attackDamage < enemyData.enemyAttack / 20){
          attackDamage = enemyData.enemyAttack / 20;
        }
        attackDps = (attackDamage / enemyData.enemySpd);
        break;
      case "法傷":
        attackDamage = enemyData.enemyAttack * ((100 - memberRow.res) / 100);
        if(attackDamage < enemyData.enemyAttack / 20){
          attackDamage = enemyData.enemyAttack / 20;
        } 
        attackDps = (attackDamage / enemyData.enemySpd);
        break;
      case "真傷":
        attackDps = (enemyData.enemyAttack / enemyData.enemySpd);
        break;
      default:
        attackDps = 0;
        break;
    }   
    // 計算技能的DPS
    let skillDamage = 0;
    let skillDps = 0;
    let skillDpsTotal = 0;
    if(enemyData.enemySkill.length > 0){
      enemyData.enemySkill.forEach((item) => {
        switch(item.enemySkillType){
          case "物傷":
              skillDamage = item.enemySkillDamage - memberRow.def;
              if(skillDamage < item.enemySkillDamage / 20){
                skillDamage = item.enemySkillDamage / 20;              
              }
              skillDps = ((skillDamage * item.enemySkillCount) / item.enemySkillWaitTime);
              skillDpsTotal += skillDps;     
          break;
          case "法傷":
              skillDamage = item.enemySkillDamage * ((100 - memberRow.res) / 100);
              if(skillDamage < item.enemySkillDamage / 20){
                skillDamage = item.enemySkillDamage / 20;              
              }
              skillDps = ((skillDamage * item.enemySkillCount) / item.enemySkillWaitTime);
              skillDpsTotal += skillDps;    
              break;
          case "真傷":
              skillDps = ((item.enemySkillDamage * item.enemySkillCount) / item.enemySkillWaitTime);
              skillDpsTotal += skillDps;
              break;
          default:
            skillDpsTotal += 0;
            break;
        }
      });
    }
    return (attackDps + skillDpsTotal).toFixed(2);
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
      default:
      break;
    }
    return copyMemberRow;
  },
  // 技能期間我方HPS
  skillMemberHps: (skillRow, memberJsonData) => {
    const newMemberRow = Calculator.skillMemberRow(skillRow, memberJsonData);
    let finalHps = 0;
    let specialHps = 0;
    if(skillRow.skillTime != -1){
      // 正常類型技能
      finalHps = Calculator.memberHps(newMemberRow);      
    }
    else{
      // 強力擊類型技能
      finalHps = (newMemberRow.attack / skillRow.waitTime).toFixed(2);
    }
    specialHps = MemberSpecial.memberHpsSpecial(newMemberRow, finalHps);
    return MemberSpecial.defSkillHpsSpecial(skillRow, specialHps);
  }
}

export default Calculator;
