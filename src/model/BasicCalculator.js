import TalentsCalculatorModel from './TalentsCalculator';
import subProfessionIdCalculatorModel from './subProfessionIdCalculator';
import MemberSpecial from './MemberSpecial';

const BasicCalculatorModel = {
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

  //我方星級
  memberRarity: (memberRow) => {
    const rarity = memberRow.rarity;
    switch(rarity){
      case "TIER_1":
        return 1;
      case "TIER_2":
        return 2;
      case "TIER_3":
        return 3;
      case "TIER_4":
        return 4;
      case "TIER_5":
        return 5;
      case "TIER_6":
        return 6;
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
    const witchPhases = BasicCalculatorModel.type(type).witchPhases;
    const witchAttributesKeyFrames = BasicCalculatorModel.type(type).witchAttributesKeyFrames;
    //phases是array型別，對應幹員所有階段，[0] = 精零、[1] = 精一、[2] = 精二
    //phases.attributesKeyFrames是array型別，對應幹員1級與滿級的數據，[0] = 1級、[1] = 滿級
    const maxPhases = memberRow.phases.length; //3星幹員沒有精二，1、2星幹員沒有精一精二，此用於輔助判斷
    //基礎數值
    const basicData = memberRow.phases[witchPhases]?.attributesKeyFrames[witchAttributesKeyFrames]?.data ?? memberRow.phases[maxPhases - 1]?.attributesKeyFrames[1]?.data;
    //生命
    let maxHp = basicData.maxHp; 
    //攻擊
    let atk = basicData.atk; 
    //防禦
    let def = basicData.def; 
    //法抗
    let magicResistance = basicData.magicResistance; 
    //攻擊間隔
    let baseAttackTime = basicData.baseAttackTime; 
    //攻速
    let attackSpeed = basicData.attackSpeed; 

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

    //天賦數值
    //生命
    maxHp *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, 'max_hp'));
    //攻擊
    atk *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, 'atk'));
    //防禦
    def *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, 'def'));
    //法抗
    magicResistance += TalentsCalculatorModel.memberTalent(type, memberRow, 'magic_resistance');
    //攻擊間隔
    baseAttackTime += TalentsCalculatorModel.memberTalent(type, memberRow, 'base_attack_time');   
    //攻速
    attackSpeed += TalentsCalculatorModel.memberTalent(type, memberRow, 'attack_speed');        
    
    
    return { maxHp, atk, def, magicResistance, baseAttackTime, attackSpeed};
  },

  //我方DPH
  dph: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const attackType = BasicCalculatorModel.memberSubProfessionId(memberRow, subProfessionIdJsonData).attackType;
    const attack = BasicCalculatorModel.memberNumeric(type, memberRow).atk;
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
    //針對特定分支重新計算並傳回新的DPH，其餘分支則傳回原本的DPH
    dph = subProfessionIdCalculatorModel.subProfessionIdDPH(type, memberRow, enemyData, dph);
    return dph;
  },

  //我方DPS
  memberDps: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const dph = BasicCalculatorModel.dph(type, memberRow, enemyData, subProfessionIdJsonData);
    const baseAttackTime = BasicCalculatorModel.memberNumeric(type, memberRow).baseAttackTime;
    const attackSpeed = BasicCalculatorModel.memberNumeric(type, memberRow).attackSpeed;
    const finalSpd = baseAttackTime / (attackSpeed / 100);
    let dps = dph / finalSpd;
    //針對特定分支重新計算並傳回新的DPS，其餘分支則傳回原本的DPS
    dps = subProfessionIdCalculatorModel.subProfessionIdDPS(type, memberRow, enemyData, subProfessionIdJsonData, dps);
    return dps;
  },

  //我方HPH
  hph: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const attackType = BasicCalculatorModel.memberSubProfessionId(memberRow, subProfessionIdJsonData).attackType;
    const attack = BasicCalculatorModel.memberNumeric(type, memberRow).atk;
    let hph = 0;
    switch(attackType){
      case "治療":
        hph = attack;
      break;     
    }
    //針對特定分支重新計算並傳回新的DPH，其餘分支則傳回原本的DPH
    hph = subProfessionIdCalculatorModel.subProfessionIdHPH(type, memberRow, enemyData, hph);
    return hph;
  },

  //我方HPS
  memberHps: (type, memberRow, enemyData, subProfessionIdJsonData) => {
    const hph = BasicCalculatorModel.hph(type, memberRow, enemyData, subProfessionIdJsonData);
    const baseAttackTime = BasicCalculatorModel.memberNumeric(type, memberRow).baseAttackTime;
    const attackSpeed = BasicCalculatorModel.memberNumeric(type, memberRow).attackSpeed;
    const finalSpd = baseAttackTime / (attackSpeed / 100);
    const hps = hph / finalSpd;
    return hps;
  },

  //敵方DPS
  enemyDps: (type, memberRow, enemyData) => {
    //計算平A的DPS
    let dph = 0;
    let dps = 0;      
    const def = BasicCalculatorModel.memberNumeric(type, memberRow).def
    const magicResistance = BasicCalculatorModel.memberNumeric(type, memberRow).magicResistance
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
    //計算技能的DPS
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
}

export default BasicCalculatorModel;
