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
    let finalHps = 0;

    switch(memberRow.attackType){
      case "治療":
        finalHps = (memberRow.attack / memberRow.spd).toFixed(2);
      return MemberSpecial.memberHpsSpecial(memberRow, finalHps);
      default:
      return 0;
    }
  },
  // 擊殺所需時間
  memberKillTime: (memberRow, enemyData) => {
    let dpsStr = '';

    dpsStr = Calculator.memberDps(memberRow, enemyData);
    switch(memberRow.attackType){
      case "物傷":       
      return (Math.ceil(enemyData.enemyHp / parseFloat(dpsStr.replace(/[^0-9.]/g, ""))));
      case "法傷":
      return (Math.ceil(enemyData.enemyHp / parseFloat(dpsStr.replace(/[^0-9.]/g, ""))));
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
              skillDamage = item.enemySkillDamage - memberRow.def;console.log(skillDamage);
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
  // 技能期間DPS
  attackSkillDps: (skillRow, memberJsonData, enemyData) => {
    let memberRow = memberJsonData.find(item => item.name === skillRow.name);
    let finalAttack = 0;
    let finalSpd = 0;
    let copyMemberRow = {};
    let finalDamage = 0;
    let finalDps = 0;
  
    // 最終攻擊力 = (((原始攻擊力 + 直接固定加算) * 直接倍率乘算) + 最終固定加算) * 最終倍率乘算
    finalAttack = (((memberRow.attack + skillRow.attackFirstAdd) * skillRow.attackFirtsMultiply) + skillRow.attackLastAdd) * skillRow.attackLastMultiply;
    
    // 最終攻速 = (原始攻擊間隔 - 攻擊間隔縮短時間) / ((100 + 攻速提升) / 100)
    // 需注意(100 + 攻速提升)的最終值最小不低於20，最大不高於600
    finalSpd = (memberRow.spd - skillRow.spdAdd) / ((100 + Math.max(-80, Math.min(500, skillRow.spdMultiply))) / 100)

    // 由於攻擊力和攻擊間隔已發生改變，因此需將新的數值蓋掉原數值，這樣在memberDpsSpecial()計算DPS時才不會出錯
    copyMemberRow = JSON.parse(JSON.stringify(memberRow));
    // 改變後的攻擊力和攻擊間隔可能不是整數，攻擊力和攻擊間隔直接取至小數點後兩位
    copyMemberRow.attack = finalAttack.toFixed(2);
    copyMemberRow.spd = finalSpd.toFixed(2);
    switch(skillRow.attackType){
      case "物傷":
        finalDamage = finalAttack - enemyData.enemyDef;
        if(finalDamage < finalAttack / 20){
          finalDamage = finalAttack / 20;
        }
        finalDps = (finalDamage / finalSpd).toFixed(2);   
      return MemberSpecial.memberDpsSpecial(copyMemberRow, enemyData, finalDps);
      case "法傷":
        finalDamage = finalAttack * ((100 - enemyData.enemyRes) / 100);
        if(finalDamage < finalAttack / 20){
          finalDamage = finalAttack / 20;
        }
        finalDps = (finalDamage / finalSpd).toFixed(2);
      return MemberSpecial.memberDpsSpecial(copyMemberRow, enemyData, finalDps);
      default:
      return 0;
    }
  },
  // 擊殺所需時間
  attackSkillKillTime: (skillRow, memberJsonData, enemyData) => {
    let memberRow = memberJsonData.find(item => item.name === skillRow.name);
    let dpsStr = '';

    dpsStr = Calculator.attackSkillDps(skillRow, memberJsonData, enemyData);  
    switch(memberRow.attackType){
      case "物傷":       
      return (Math.ceil(enemyData.enemyHp / parseFloat(dpsStr.replace(/[^0-9.]/g, ""))));
      case "法傷":
      return (Math.ceil(enemyData.enemyHp / parseFloat(dpsStr.replace(/[^0-9.]/g, ""))));
      default:
      return Infinity; // Infinity屬於number的一個值，此值必定會被視為最大值
    }
  },
  // 技能總傷
  attackSkillTotal: (skillRow, memberJsonData, enemyData) => {
    let dpsStr = '';

    dpsStr = Calculator.attackSkillDps(skillRow, memberJsonData, enemyData);  
    switch(skillRow.attackType){
      case "物傷":        
      return parseInt(parseFloat(dpsStr.replace(/[^0-9.]/g, "")) * skillRow.skillTime);
      case "法傷":
      return parseInt(parseFloat(dpsStr.replace(/[^0-9.]/g, "")) * skillRow.skillTime);
      default:
      return Infinity; // Infinity屬於number的一個值，此值必定會被視為最大值
    }
  }
}


export default Calculator;
