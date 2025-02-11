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
  // 攻擊技能期間DPS
  attackSkillDps: (attackSkillRow, memberJsonData, enemyData) => {
    let memberRow = memberJsonData.find(item => item.name === attackSkillRow.name);
    // 最終攻擊力 = (((原始攻擊力 + 直接固定加算) * 直接倍率乘算) + 最終固定加算) * 最終倍率乘算
    let finalAttack = (((memberRow.attack + attackSkillRow.attackFirstAdd) * attackSkillRow.attackFirtsMultiply) + attackSkillRow.attackLastAdd) * attackSkillRow.attackLastMultiply; 
    // 最終攻速 = (原始攻擊間隔 - 攻擊間隔縮短時間) / ((100 + 攻速提升) / 100)
    // 需注意(100 + 攻速提升)的最終值最小不低於20，最大不高於600
    let finalSpd = (memberRow.spd - attackSkillRow.spdAdd) / ((100 + Math.max(-80, Math.min(500, attackSkillRow.spdMultiply))) / 100)
    // 由於攻擊力和攻擊間隔已發生改變，因此需將新的數值蓋掉原數值，這樣在memberDpsSpecial()計算DPS時才不會出錯
    let copyMemberRow = JSON.parse(JSON.stringify(memberRow));
    // 改變後的攻擊力和攻擊間隔可能不是整數，攻擊力和攻擊間隔直接取至小數點後兩位
    copyMemberRow.attack = finalAttack.toFixed(2);
    copyMemberRow.spd = finalSpd.toFixed(2);
    return Calculator.memberDps(copyMemberRow, enemyData);
  },
  // 擊殺所需時間
  attackSkillKillTime: (attackSkillRow, memberJsonData, enemyData) => {
    let memberRow = memberJsonData.find(item => item.name === attackSkillRow.name);
    let dps = Calculator.attackSkillDps(attackSkillRow, memberJsonData, enemyData);  
    switch(memberRow.attackType){
      case "物傷":       
      return (Math.ceil(enemyData.enemyHp / dps));
      case "法傷":
      return (Math.ceil(enemyData.enemyHp / dps));
      default:
      return Infinity; // Infinity屬於number的一個值，此值必定會被視為最大值
    }
  },
  // 攻擊技能總傷
  attackSkillTotal: (attackSkillRow, memberJsonData, enemyData) => {
    let dps = Calculator.attackSkillDps(attackSkillRow, memberJsonData, enemyData);  
    switch(attackSkillRow.attackType){
      case "物傷":        
      return parseInt(dps * attackSkillRow.skillTime);
      case "法傷":
      return parseInt(dps * attackSkillRow.skillTime);
      default:
      return Infinity; // Infinity屬於number的一個值，此值必定會被視為最大值
    }
  },
  // 防禦技能期間DEF
  defSkillDef: (defSkillRow, memberJsonData) => {
    let memberRow = memberJsonData.find(item => item.name === defSkillRow.name);
    // 最終防禦力 = (((原始防禦力 + 直接固定加算) * 直接倍率乘算) + 最終固定加算) * 最終倍率乘算
    let finalDef = (((memberRow.def + defSkillRow.skillFirstAdd) * defSkillRow.skillFirtsMultiply) + defSkillRow.skillLastAdd) * defSkillRow.skillLastMultiply;
    // 改變後的防禦力可能不是整數，防禦力直接取至小數點後兩位
    finalDef = finalDef.toFixed(2);
    switch(defSkillRow.skillType){
      case "防禦":   
      return finalDef;
      default:
      return memberRow.def;
    }
    
  },
  // 防禦技能期間HPS
  defSkillHps: (defSkillRow, memberJsonData) => {
    let memberRow = memberJsonData.find(item => item.name === defSkillRow.name);   
    // 最終攻擊力 = (((原始攻擊力 + 直接固定加算) * 直接倍率乘算) + 最終固定加算) * 最終倍率乘算
    let finalAttack = (((memberRow.attack + defSkillRow.skillFirstAdd) * defSkillRow.skillFirtsMultiply) + defSkillRow.skillLastAdd) * defSkillRow.skillLastMultiply; 
    // 最終攻速 = (原始攻擊間隔 - 攻擊間隔縮短時間) / ((100 + 攻速提升) / 100)
    // 需注意(100 + 攻速提升)的最終值最小不低於20，最大不高於600
    let finalSpd = (memberRow.spd - defSkillRow.spdAdd) / ((100 + Math.max(-80, Math.min(500, defSkillRow.spdMultiply))) / 100)
    // 由於攻擊力和攻擊間隔已發生改變，因此需將新的數值蓋掉原數值，這樣在memberHpsSpecial()計算HPS時才不會出錯
    let copyMemberRow = JSON.parse(JSON.stringify(memberRow));
    // 改變後的攻擊力和攻擊間隔可能不是整數，攻擊力和攻擊間隔直接取至小數點後兩位
    copyMemberRow.attack = finalAttack.toFixed(2);
    copyMemberRow.spd = finalSpd.toFixed(2);
    let finalHps = 0;
    switch(defSkillRow.skillType){
      case "治療":
        if(defSkillRow.skillTime != -1){
          finalHps = (finalAttack / finalSpd).toFixed(2);  
        }
        else{
          // 技能時間 = -1 表示此為強力擊，則HPS的算法應該改為以技能等待時間作為HPS的計算時間
          finalHps = (finalAttack / defSkillRow.waitTime).toFixed(2);  
        }         
      return MemberSpecial.memberHpsSpecial(copyMemberRow, finalHps);
      default:
      return 0;
    }
  },
  defSkillEnemyDps (defSkillRow, memberJsonData, enemyData){
    let memberRow = memberJsonData.find(item => item.name === defSkillRow.name);
    let finalDef = Calculator.defSkillDef(defSkillRow, memberJsonData);
    // 由於防禦力已發生改變，因此需將新的數值蓋掉原數值，這樣在enemyDps()計算敵方DPS時才不會出錯
    let copyMemberRow = JSON.parse(JSON.stringify(memberRow));
    copyMemberRow.def = finalDef;
    return Calculator.enemyDps(copyMemberRow, enemyData);
  }
}

export default Calculator;
