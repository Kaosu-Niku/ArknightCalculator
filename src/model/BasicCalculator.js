import UniequipCalculatorModel from './UniequipCalculator';
import TalentsCalculatorModel from './TalentsCalculator';

const BasicCalculatorModel = {
  //查詢當前所選流派 (回傳object，key有witchPhases、witchAttributesKeyFrames)
  //witchPhases對應流派的階段，0 = 精零、1 = 精一、2 = 精二
  //witchAttributesKeyFrames對應幹員流派的等級，0 = 1級、1 = 滿級
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

  //查詢幹員的星級 (回傳number)
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

  //查詢幹員的職業 (回傳object，詳情內容參考profession.json)
  memberProfession: (memberRow, professionJsonData) => {
    const profession = memberRow.profession;
    return professionJsonData[profession];
  },

  //查詢幹員的分支 (回傳object，詳情內容參考subProfessionId.json)
  memberSubProfessionId: (memberRow, subProfessionIdJsonData) => {
    const subProfessionId = memberRow.subProfessionId;
    return subProfessionIdJsonData[subProfessionId];
  },

  //計算幹員的基礎數據在經過各種加成後的最終數據 (回傳object，key對應某個屬性)
  //(maxHp = 生命、atk = 攻擊、def = 防禦、magicResistance = 法抗、baseAttackTime = 攻擊間隔、attackSpeed = 攻速)
  memberNumeric: (type, memberRow, uniequipJsonData, battleEquipJsonData) => {
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
    if(witchPhases === 2){
      const equipBattle = UniequipCalculatorModel.memberEquipBattle(memberRow, uniequipJsonData, battleEquipJsonData);
      if(equipBattle){
        for (const attributeBlackboard of equipBattle.attributeBlackboard) {
          if(attributeBlackboard.key === 'max_hp'){
            //生命
            maxHp += attributeBlackboard.value;   
          }
          else if(attributeBlackboard.key === 'atk'){
            //攻擊
            atk += attributeBlackboard.value;   
          }
          else if(attributeBlackboard.key === 'def'){
            //防禦
            def += attributeBlackboard.value;   
          }
          else if(attributeBlackboard.key === 'magic_resistance'){
            //法抗
            magicResistance += attributeBlackboard.value;   
          }
          else if(attributeBlackboard.key === 'attack_speed'){
            //攻速
            attackSpeed += attributeBlackboard.value;
          }                                                        
        }
      }
    }

    //天賦數值
    //生命
    maxHp *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'max_hp'));
    //攻擊
    atk *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'atk'));
    //防禦
    def *= (1 + TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'def'));
    //法抗
    magicResistance += TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'magic_resistance');
    //攻擊間隔
    baseAttackTime += TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'base_attack_time');   
    //攻速
    attackSpeed += TalentsCalculatorModel.memberTalent(type, memberRow, uniequipJsonData, battleEquipJsonData, 'attack_speed');        

    return { maxHp, atk, def, magicResistance, baseAttackTime, attackSpeed};
  },

  //計算敵方的DPS
  enemyDps: (type, memberRow, enemyData, uniequipJsonData, battleEquipJsonData) => {
    //計算平A的DPS
    let dph = 0;
    let dps = 0;      
    const def = BasicCalculatorModel.memberNumeric(type, memberRow, uniequipJsonData, battleEquipJsonData).def
    const magicResistance = BasicCalculatorModel.memberNumeric(type, memberRow, uniequipJsonData, battleEquipJsonData).magicResistance
    switch(enemyData.enemyAttackType){
      case "物傷":
        dph = enemyData.enemyAttack - def;
        dph = dph < enemyData.enemyAttack / 20 ? enemyData.enemyAttack / 20 : dph;
        dps = (dph / enemyData.enemySpd);
      break;
      case "法傷":
        dph = enemyData.enemyAttack * ((100 - magicResistance) / 100);
        dph = dph < enemyData.enemyAttack / 20 ? enemyData.enemyAttack / 20 : dph;
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
            skillDph = skillDph < item.enemySkillDamage / 20 ? item.enemySkillDamage / 20 : skillDph;
          break;
          case "法傷":
            skillDph = item.enemySkillDamage * ((100 - magicResistance) / 100);
            skillDph = skillDph < item.enemySkillDamage / 20 ? item.enemySkillDamage / 20 : skillDph;    
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
