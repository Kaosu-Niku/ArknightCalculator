import MemberSpecial from './MemberSpecial';

const Calculator = {
  //當前流派
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
  //我方名稱
  memberNameRender: (memberRow) => {
    let newName = memberRow.name; 
    //如果是四星隊，在名字後面標註模組
    // if('mod' in memberRow){
    //   newName += `(${memberRow.mod})`;
    // }
    return newName; 
  },
  //我方星級
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
    return professionJsonData[profession];
  },
  //我方分支
  memberSubProfessionId: (memberRow, subProfessionIdJsonData) => {
    const subProfessionId = memberRow.subProfessionId;
    return subProfessionIdJsonData[subProfessionId];
  },
  //我方計算完後的最終數據
  memberData: (type, memberRow) => {
    //流派
    const witchPhases = Calculator.type(type).witchPhases;
    const witchAttributesKeyFrames = Calculator.type(type).witchAttributesKeyFrames;
    //基礎數值
    const maxPhases = memberRow.phases.length; 
    const basicData = memberRow.phases[witchPhases]?.attributesKeyFrames[witchAttributesKeyFrames]?.data ?? memberRow.phases[maxPhases - 1]?.attributesKeyFrames[1]?.data;
    let maxHp = basicData.maxHp; //生命
    let atk = basicData.atk; //攻擊
    let def = basicData.def; //防禦
    let magicResistance = basicData.magicResistance; //法抗
    let baseAttackTime = basicData.baseAttackTime; //攻擊間隔
    let attackSpeed = basicData.attackSpeed; //攻速
    //潛能數值
    const potentialRanksData = memberRow.potentialRanks ?? null;
    potentialRanksData?.forEach((element, index) => { 
      if(element.buff?.attributes?.attributeModifiers[0]?.attributeType === "MAX_HP"){
        //生命
        maxHp += element.buff?.attributes?.attributeModifiers[0]?.value;       
      }
      if(element.buff?.attributes?.attributeModifiers[0]?.attributeType === "ATK"){
        //攻擊
        atk += element.buff?.attributes?.attributeModifiers[0]?.value;
      }     
      if(element.buff?.attributes?.attributeModifiers[0]?.attributeType === "DEF"){
        //防禦
        def += element.buff?.attributes?.attributeModifiers[0]?.value;
      } 
      if(element.buff?.attributes?.attributeModifiers[0]?.attributeType === "MAGIC_RESISTANCE"){
        //法抗
        magicResistance += element.buff?.attributes?.attributeModifiers[0]?.value;
      } 
      if(element.buff?.attributes?.attributeModifiers[0]?.attributeType === "ATTACK_SPEED"){
        //攻速
        attackSpeed += element.buff?.attributes?.attributeModifiers[0]?.value;
      }    
    });
    //信賴數值
    const favorKeyFrames = memberRow.favorKeyFrames ?? null;
    favorKeyFrames?.forEach((element, index) => { 
      if(element.level === 50){
        //生命
        maxHp += element.data?.maxHp;   
        //攻擊
        atk += element.data?.atk;    
        //防禦
        def += element.data?.def;  
        //法抗
        magicResistance += element.data?.magicResistance;  
      }  
    });
    
    return { maxHp, atk, def, magicResistance, baseAttackTime, attackSpeed};
  },
  // 我方DPH
  dph: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const attackType = Calculator.memberSubProfessionId(memberRow, subProfessionIdJsonData).attackType;
    const attack = Calculator.memberData(type, memberRow).atk;
    let dph = 0;
    switch(attackType){
      case "物理":
        dph = attack - enemyData.enemyDef;
        if(dph < attack / 20){
          dph = attack / 20;
        }
      break;
      case "法術":
        dph = attack * ((100 - enemyData.enemyRes) / 100);
        if(dph < attack / 20){
          dph = attack / 20;
        }
      break;     
    }
    return dph;
  },
  // 我方DPS
  memberDps: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const dph = Calculator.dph(type, memberRow, enemyData, subProfessionIdJsonData);
    const baseAttackTime = Calculator.memberData(type, memberRow).baseAttackTime;
    const attackSpeed = Calculator.memberData(type, memberRow).attackSpeed;
    const finalSpd = baseAttackTime / (attackSpeed / 100);
    const dps = dph / finalSpd;
    return dps;//MemberSpecial.memberDpsSpecial(memberRow, enemyData, dps);
  },
  // 我方HPH
  hph: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const attackType = Calculator.memberSubProfessionId(memberRow, subProfessionIdJsonData).attackType;
    const attack = Calculator.memberData(type, memberRow).atk;
    let hph = 0;
    switch(attackType){
      case "治療":
        hph = attack;
      break;     
    }
    //咒癒師是透過攻擊造成傷害來治療的分支，需另外處理
    //無模組的咒癒師的治療量是所造成傷害的50%
    if(memberRow.subProfessionId === "incantationmedic"){
      const dph = Calculator.dph(type, memberRow, enemyData, subProfessionIdJsonData);
      hph = dph * 0.5;
    }
    return hph;
  },
  // 我方HPS
  memberHps: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const hph = Calculator.hph(type, memberRow, enemyData, subProfessionIdJsonData);
    const baseAttackTime = Calculator.memberData(type, memberRow).baseAttackTime;
    const attackSpeed = Calculator.memberData(type, memberRow).attackSpeed;
    const finalSpd = baseAttackTime / (attackSpeed / 100);
    const hps = hph / finalSpd;
    return hps;//MemberSpecial.memberHpsSpecial(memberRow, hps);
  },
  // 敵方DPS
  enemyDps: (type, memberRow, enemyData) => {
    // 計算平A的DPS
    let dph = 0;
    let dps = 0;      
    const def = Calculator.memberData(type, memberRow).def
    const magicResistance = Calculator.memberData(type, memberRow).magicResistance
    switch(enemyData.enemyAttackType){
      case "物傷":
        dph = enemyData.enemyAttack - def;
        if(dph < enemyData.enemyAttack / 20){
          dph = enemyData.enemyAttack / 20;
        }
        dps = (dph / enemyData.enemySpd);
      break;
      case "法傷":
        dph = enemyData.enemyAttack * ((100 - magicResistance) / 100);
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
            skillDph = item.enemySkillDamage - def;
            if(skillDph < item.enemySkillDamage / 20){
              skillDph = item.enemySkillDamage / 20;              
            }  
          break;
          case "法傷":
            skillDph = item.enemySkillDamage * ((100 - magicResistance) / 100);
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
