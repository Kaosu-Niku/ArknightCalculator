import MemberSpecial from './MemberSpecial';

const CalculatorModel = {
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

    //如果是四星以上的，在名字後面標註模組
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

  //我方模組 (回傳object array類型，因為一個幹員會有多個模組)
  memberUniequip: (memberRow, uniequipJsonData) => {
    //由於幹員數據的potentialItemId的格式是: p_char_[數字]_[英文名稱]
    //模組數據的charId的格式是: char_[數字]_[英文名稱]
    //因此在比對id查詢之前，先刪除前面的p_兩字    
    const memberId = memberRow.potentialItemId?.substring(2);

    //charEquip是object型別，每個key值都對應一個幹員id，而每個value都是array型別，包含所有此幹員的模組id
    const uniequipIdList = uniequipJsonData.charEquip[memberId];
    
    const uniequipContentList = [];

    //一些幹員沒有模組，需要判斷undefined
    uniequipIdList === undefined ? 
    //對於無模組的幹員，至少給一個uniEquipName的假資料防止undefined
    uniequipContentList.push({ uniEquipName: "無模組" }) : 
    //有模組的幹員，遍歷屬於他的每一個模組
    uniequipIdList.forEach(e => {
      //equipDict是object型別，每個key值都對應一個模組id
      const uniequip = uniequipJsonData.equipDict[e];
      uniequipContentList.push(uniequip);
    });        
    
    return uniequipContentList;
  },

  //我方計算完各種加成後的最終數據
  memberNumeric: (type, memberRow) => {
    //流派
    const witchPhases = CalculatorModel.type(type).witchPhases;
    const witchAttributesKeyFrames = CalculatorModel.type(type).witchAttributesKeyFrames;
    //phases是array型別，對應幹員所有階段，[0] = 精零、[1] = 精一、[2] = 精二
    //phases.attributesKeyFrames是array型別，對應幹員1級與滿級的數據，[0] = 1級、[1] = 滿級
    const maxPhases = memberRow.phases.length; //3星幹員沒有精二，1、2星幹員沒有精一精二，此用於輔助判斷
    //基礎數值
    const basicData = memberRow.phases[witchPhases]?.attributesKeyFrames[witchAttributesKeyFrames]?.data ?? memberRow.phases[maxPhases - 1]?.attributesKeyFrames[1]?.data;
    let maxHp = basicData.maxHp; //生命
    let atk = basicData.atk; //攻擊
    let def = basicData.def; //防禦
    let magicResistance = basicData.magicResistance; //法抗
    let baseAttackTime = basicData.baseAttackTime; //攻擊間隔
    let attackSpeed = basicData.attackSpeed; //攻速
    //潛能數值
    const potentialRanksData = memberRow.potentialRanks;
    potentialRanksData.forEach((element, index) => { 
      //一些幹員沒有辦法提升潛能，需要判斷null
      if(element.buff?.attributes.attributeModifiers[0].attributeType === "MAX_HP"){
        //生命
        maxHp += element.buff.attributes.attributeModifiers[0].value;       
      }
      if(element.buff?.attributes.attributeModifiers[0].attributeType === "ATK"){
        //攻擊
        atk += element.buff.attributes.attributeModifiers[0].value;
      }     
      if(element.buff?.attributes.attributeModifiers[0].attributeType === "DEF"){
        //防禦
        def += element.buff.attributes.attributeModifiers[0].value;
      } 
      if(element.buff?.attributes.attributeModifiers[0].attributeType === "MAGIC_RESISTANCE"){
        //法抗
        magicResistance += element.buff.attributes.attributeModifiers[0].value;
      } 
      if(element.buff?.attributes.attributeModifiers[0].attributeType === "ATTACK_SPEED"){
        //攻速
        attackSpeed += element.buff.attributes.attributeModifiers[0].value;
      }    
    });
    //信賴數值
    const favorKeyFrames = memberRow.favorKeyFrames;
    favorKeyFrames.forEach((element, index) => { 
      if(element.level === 50){
        //生命
        maxHp += element.data.maxHp;   
        //攻擊
        atk += element.data.atk;    
        //防禦
        def += element.data.def;  
        //法抗
        magicResistance += element.data.magicResistance;  
      }  
    });
    //模組數值
    const uniequip = memberRow.uniequip
    //不是[精二1級]與[精二滿級]流派就沒有辦法開模組，需要判斷
    if(witchPhases === 2){
      
    }
    
    return { maxHp, atk, def, magicResistance, baseAttackTime, attackSpeed};
  },

  // 我方DPH
  dph: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const attackType = CalculatorModel.memberSubProfessionId(memberRow, subProfessionIdJsonData).attackType;
    const attack = CalculatorModel.memberNumeric(type, memberRow).atk;
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
    const dph = CalculatorModel.dph(type, memberRow, enemyData, subProfessionIdJsonData);
    const baseAttackTime = CalculatorModel.memberNumeric(type, memberRow).baseAttackTime;
    const attackSpeed = CalculatorModel.memberNumeric(type, memberRow).attackSpeed;
    const finalSpd = baseAttackTime / (attackSpeed / 100);
    const dps = dph / finalSpd;
    return dps;//MemberSpecial.memberDpsSpecial(memberRow, enemyData, dps);
  },

  // 我方HPH
  hph: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const attackType = CalculatorModel.memberSubProfessionId(memberRow, subProfessionIdJsonData).attackType;
    const attack = CalculatorModel.memberNumeric(type, memberRow).atk;
    let hph = 0;
    switch(attackType){
      case "治療":
        hph = attack;
      break;     
    }
    //咒癒師是透過攻擊造成傷害來治療的分支，需另外處理
    //無模組的咒癒師的治療量是所造成傷害的50%
    if(memberRow.subProfessionId === "incantationmedic"){
      const dph = CalculatorModel.dph(type, memberRow, enemyData, subProfessionIdJsonData);
      hph = dph * 0.5;
    }
    return hph;
  },

  // 我方HPS
  memberHps: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const hph = CalculatorModel.hph(type, memberRow, enemyData, subProfessionIdJsonData);
    const baseAttackTime = CalculatorModel.memberNumeric(type, memberRow).baseAttackTime;
    const attackSpeed = CalculatorModel.memberNumeric(type, memberRow).attackSpeed;
    const finalSpd = baseAttackTime / (attackSpeed / 100);
    const hps = hph / finalSpd;
    return hps;
  },

  // 敵方DPS
  enemyDps: (type, memberRow, enemyData) => {
    // 計算平A的DPS
    let dph = 0;
    let dps = 0;      
    const def = CalculatorModel.memberNumeric(type, memberRow).def
    const magicResistance = CalculatorModel.memberNumeric(type, memberRow).magicResistance
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
    const witchPhases = CalculatorModel.type(type).witchPhases;
    const skillLength = skillrow.levels.length;
    switch(witchPhases){
      case 0: //精零
        return skillrow.levels[skillLength - 3];
      case 1: //精一
        return skillrow.levels[skillLength - 1];
      case 2: //精二
        return skillrow.levels[skillLength - 1];
    }
  },

  //技能屬性加成
  skillAttribute: (type, skillrow, attribute) => {
    const skillData = CalculatorModel.skillData(type, skillrow);
    return skillData.blackboard?.find(entry => entry.key === attribute)?.value ?? 0;
  },

  // 技能期間我方DPS
  skillMemberDps: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => {
    const memberData = CalculatorModel.skillFromMember(skillRow, characterJsonData);
    const memberNumeric = CalculatorModel.memberNumeric(type, memberData);

    const attackType = CalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).attackType;
    let dph = 0;
    let attackMulti = CalculatorModel.skillAttribute(type, skillRow, 'atk');
    let attackScale = CalculatorModel.skillAttribute(type, skillRow, 'atk_scale');
    //[攻擊倍率]需要判斷是否 > 0，確保原資料是0的不會跟著變成0
    attackScale = attackScale > 0 ? attackScale : 1;
    let damageMulti = CalculatorModel.skillAttribute(type, skillRow, 'damage_scale');
    let finalDamage = 0

    switch(attackType){
      case "物理":
        //物理DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) - (敵人防禦 * (1 - 削減敵方防禦[比例]) - 削減敵方防禦[固定] - 無視防禦)) * 傷害倍率)
        
        //[削減敵方防禦]需要判斷 < 0 才是削減敵人，若 > 0 是我方加防禦    
        let defDivide = CalculatorModel.skillAttribute(type, skillRow, 'def') < 0 ? CalculatorModel.skillAttribute(type, skillRow, 'def') : 0;
        //再判斷值大小，通常來說絕對值 < 1 的值是比例值，而絕對值 > 1 的值是固定值
        let defDivideA = 0; //比例
        let defDivideB = 0; //固定
        if(defDivide > -1){
          defDivideA = defDivide;
        }
        else{
          defDivideB = defDivide;
        }
        let defSub = CalculatorModel.skillAttribute(type, skillRow, 'def_penetrate_fixed');
        let finalEnemyDef = enemyData.enemyDef * (1 + defDivideA) + defDivideB - defSub;
        //需要判斷削弱防禦與無視防禦後的剩餘防禦是否 < 0
        finalEnemyDef = finalEnemyDef < 0 ? 0 : finalEnemyDef;          
        finalDamage = ((memberNumeric.atk * (1 + attackMulti) * attackScale) - finalEnemyDef);
      break;
      case "法術":
        //法術DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) * ((100 - 敵人法抗) / 100)) * 傷害倍率)

        //[削減敵方法抗]需要判斷 < 0 才是削減敵人，若 > 0 是我方加法抗  
        let resDivide = CalculatorModel.skillAttribute(type, skillRow, 'magic_resistance') < 0 ? CalculatorModel.skillAttribute(type, skillRow, 'magic_resistance') : 0;
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

    let attackTimeRevise = CalculatorModel.skillAttribute(type, skillRow, 'base_attack_time');
    let attackSpeedRevise = CalculatorModel.skillAttribute(type, skillRow, 'attack_speed');

    //最終攻擊間隔 = (幹員攻擊間隔 + 攻擊間隔調整) / ((幹員攻速 + 攻擊速度加算) / 100)
    let finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise) / 100);

    let times = CalculatorModel.skillAttribute(type, skillRow, 'times');
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
    const dps = CalculatorModel.skillMemberDps(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData);
    let duration = CalculatorModel.skillData(type, skillRow).duration;
    //[技能持續時間]需要判斷是否 < 1 ，確保強力擊、脫手類、永續類的技能不會計算錯誤
    duration = duration < 1 ? 1 : duration;
    let times = CalculatorModel.skillAttribute(type, skillRow, 'times');
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

export default CalculatorModel;
