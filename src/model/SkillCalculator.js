import BasicCalculatorModel from '../model/BasicCalculator';
import SkillCustomCalculatorModel from './SkillCustomCalculator';
import TalentsCalculatorModel from './TalentsCalculator';
import TalentsCustomCalculatorModel from './TalentsCustomCalculator';
import CookieModel from './Cookie';
import MemberSpecial from './MemberSpecial';

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
          return item.skillId === skillId
        });
        if(checkSkill === true){
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

  //依照指定key名嘗試查詢幹員是否有對應的技能屬性，並回傳此技能屬性的加成值 (若查詢不到則默認回傳0)
  skillAttribute: (type, skillrow, attribute) => {
    const skillData = SkillCalculatorModel.skillData(type, skillrow);
    return skillData.blackboard?.find(entry => entry.key === attribute)?.value ?? 0;
  },

  //包含合理性檢查以及自定技能數據查詢的技能屬性查詢
  skillCustomAttribute: (type, skillrow, memberData, attribute) => {
    const skillData = SkillCalculatorModel.skillData(type, skillrow);

    //此處查詢方式較為特殊，分成多個步驟
    const checkName = `${memberData.name}-${skillData.name}`;

    //attribute 用於對應 skill.levels[i].blackboard.key

    //1. 用attribute比對原技能數據看是否有符合結果
    if(skillData.blackboard?.find(entry => entry.key === attribute) == undefined){
      //2. 沒有符合，用checkName比對自定技能數據看是否有符合結果
      if(checkName in SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow)){
        if(attribute in SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow)[checkName]){
          //3. 有符合，回傳value
          return SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow)[checkName][attribute] ?? 0;
        }
      }
      //3. 沒有符合，回傳0
      return 0;
    }
    else{
      //2. 有符合，用checkName比對過濾清單
      //這是為了判斷合理性，因為有太多key共用的不合理情況
      //ex: 石英天賦的加攻的key是atk
      //鉛踝天賦的攻擊範圍有隱匿單位就加攻的key也是atk
      //泡泡天賦的對攻擊對象減攻擊的key也是atk
      //這導致若是不判斷的話會有許多錯誤引用的數值添加
      if(checkName in SkillCustomCalculatorModel.skillNotListToBasic){
        if(SkillCustomCalculatorModel.skillNotListToBasic[checkName].has(attribute)){
          //3. 有符合，表示該屬性不應該帶入傷害算法計算，但是依然用checkName比對過濾清單看是否有符合結果
          //ex: 深靛-灯塔守卫者 的 base_attack_time = 0.8，而 base_attack_time 對應傷害公式的攻擊間隔調整
          //可是傷害公式對攻擊間隔調整的算法是固定秒數加減，然而 深靛-灯塔守卫者 的 base_attack_time 意思卻是減少80%時間
          //所以對於此種例子就必須先在過濾清單過濾掉，然後才再自定技能數據修正回來
          if(checkName in SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow)){
            if(attribute in SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow)[checkName]){
              //4. 有符合，回傳value
              return SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow)[checkName][attribute] ?? 0;
            }
          }
          //4. 沒有符合，回傳0
          return 0;
        }
      }
      //3. 沒有符合，回傳原數值
      return skillData.blackboard?.find(entry => entry.key === attribute)?.value ?? 0;
    }
    
    //目前這套查詢方式會有個例外狀況
  },

  //計算幹員在技能期間的DPH
  skillMemberDph: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => {
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData);
    const memberTalent = TalentsCustomCalculatorModel.talentListToAttackSkill(type, memberData)[memberData.name];
    let attackType = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).attackType;

    let finalAttack = 0;
    let finalAttackOther = 0;

    //攻擊乘算
    let attackMulti = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'atk'); //技能倍率
    let talentAttackMulti = memberTalent?.attack || 0; //天賦倍率

    //攻擊倍率
    let attackScale = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'atk_scale'); //技能倍率
    //需要判斷 > 0，確保原資料是0的時候不會計算出錯
    attackScale = attackScale > 0 ? attackScale : 1;
    let talentAttackScale = memberTalent?.atk_scale || 0; //天賦倍率   

    //傷害倍率
    let damageMulti = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'damage_scale'); //技能倍率
    //需要判斷 > 0，確保原資料是0的時候不會計算出錯
    damageMulti = damageMulti > 0 ? damageMulti : 1
    let talentDamageMulti = memberTalent?.damage_scale || 0; //天賦倍率 
    
    //削減敵方防禦
    let defDivide = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'def'); //技能倍率
    let talentDefDivide = memberTalent?.def_penetrate_fixed || 0; //天賦倍率

    //無視防禦
    let defSub = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'def_penetrate_fixed'); //技能倍率

    //削減敵方法抗       
    let resDivide = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'magic_resistance'); //技能倍率
    let talentResDivide = memberTalent?.magic_resistance || 0; //天賦倍率

    //額外造成傷害
    let talentOther = memberTalent?.other || 0; //天賦倍率

    //傷害類型轉換
    let change_attackType = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'CHANGE_attackType');
    if(change_attackType){
      attackType = change_attackType;
    }

    let finalEnemyDef = 0;
    let finalEnemyRes = 0;
    
    switch(attackType){
      case "物理":
        //物理DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) - (敵人防禦 * (1 - 削減敵方防禦[比例]) - 削減敵方防禦[固定] - 無視防禦)) * 傷害倍率)        

        //[削減敵方防禦]在原遊戲數據同時有正數跟負數，正數是我方加防禦，負數才是削減敵方防禦，因此需要判斷 < 0
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

        //敵人剩餘防禦
        finalEnemyDef = enemyData.enemyDef * (1 + defDivideA + talentDefDivideA) + defDivideB + talentDefDivideB - defSub;
        //需要判斷削弱防禦與無視防禦後的敵人剩餘防禦是否 < 0
        finalEnemyDef = finalEnemyDef < 0 ? 0 : finalEnemyDef;  

        finalAttack = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) - finalEnemyDef);

        //如果talentOther有值，則表示此DPH計算造成額外傷害    
        if(talentOther !== null){
          //通常造成額外傷害都是(造成一定比例傷害)和(造成固定傷害)
          //以10為界線區分，絕對值 < 10 的值是(造成一定比例傷害)，絕對值 > 10 的值是(造成固定傷害)          
          if(talentOther < 10){
            finalAttackOther = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale) * talentOther) - finalEnemyDef);
          }
          else{
            finalAttackOther = (talentOther - finalEnemyDef);
          }
        }
      break;
      case "法術":
        //法術DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) * ((100 - (敵人法抗 * (1 + 削減敵方法抗[比例]) + 削減敵方法抗[固定])) / 100)) * 傷害倍率)

        
        //[削減敵方法抗]在原遊戲數據同時有正數跟負數，正數是我方加法抗，負數才是削減敵方法抗，因此需要判斷 < 0
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
        finalEnemyRes = enemyData.enemyRes * (1 + resDivideA + talentResDivideA) + resDivideB + talentResDivideB;
        //需要判斷削弱法抗後的敵人剩餘法抗是否在合理區間
        finalEnemyRes = finalEnemyRes > 100 ? 100 : finalEnemyRes;
        finalEnemyRes = finalEnemyRes < 0 ? 0 : finalEnemyRes;

        finalAttack = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) * ((100 - finalEnemyRes) / 100));

        //如果talentOther有值，則表示此DPH計算造成額外傷害    
        if(talentOther !== null){
          //通常造成額外傷害都是(造成一定比例傷害)和(造成固定傷害)
          //以10為界線區分，絕對值 < 10 的值是(造成一定比例傷害)，絕對值 > 10 的值是(造成固定傷害)          
          if(talentOther < 10){
            finalAttackOther = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale) * talentOther) * ((100 - finalEnemyRes) / 100));
          }
          else{
            finalAttackOther = (talentOther * ((100 - finalEnemyRes) / 100));
          }
        }
      break;   
    }
    
    //保底傷害倍率
    let talentEnsureDamage = memberTalent?.ensure_damage || 0.05; //天賦倍率  

    //finalAttack是計算完攻擊力加成以及扣除敵方防禦法抗後的原定傷害，而傷害公式要確保原定傷害過低時會至少有5%攻擊力的保底傷害 
    //(極少數角色具有保底傷害天賦，不只會有5%，而talentEnsureDamage就是為此處理的特別屬性)
    let ensureDamage = (memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) * talentEnsureDamage;
    finalAttack = finalAttack < ensureDamage ? ensureDamage : finalAttack;

    let ensureDamageOther = 0;
    if(talentOther !== null){
      if(talentOther < 10){
        ensureDamageOther = (memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale) * talentOther) * talentEnsureDamage;
      }
      else{
        ensureDamageOther = talentOther * talentEnsureDamage;
      }   
      finalAttackOther = finalAttackOther < ensureDamageOther ? ensureDamageOther : finalAttackOther;
    }   

    switch(attackType){
      case "治療":
        finalAttack = 0;
      break;
      case "不攻擊":
        finalAttack = 0;
      break;
    }

    //打印log
    if(memberData.name === CookieModel.getCookie('memberName')){  
      const skillName = SkillCalculatorModel.skillData(type, skillRow).name;
      if(CookieModel.getLog('skillMemberDph_check').includes(skillName) === false){          
        CookieModel.setLog('skillMemberDph', false);
        if(CookieModel.getLog('skillMemberDph') === false){            
          CookieModel.setLog('skillMemberDph', true);
          CookieModel.getLog('skillMemberDph_check').push(skillName);

          //技能加成數據log
          const skillData = SkillCalculatorModel.skillData(type, skillRow);
          let logObject = {};
          let logCount_blackboard = 1;
          skillData.blackboard?.forEach(b => {
            logObject[`${logCount_blackboard}. ${b.key}`] = b.value;
            logCount_blackboard += 1;
          });
          console.log(
            `'${memberData.name}-${skillName}' 的技能加成數據log`, 
            logObject
          );

          //DPH算法各項數據log
          console.log(
            `${memberData.name}的「${skillName}」的DPH算法各項數據log`,
            {
              "0.1. 幹員原始攻擊力": memberNumeric.atk,
              "0.2. 敵人原始防禦力": enemyData.enemyDef,
              "0.3. 敵人原始法抗": enemyData.enemyRes,
              "0.4. 傷害類型": attackType,
              "1.1. 攻擊乘算-技能倍率": attackMulti,
              "1.2. 攻擊乘算-天賦倍率": talentAttackMulti,
              "2.1. 攻擊倍率-技能倍率": attackScale,
              "2.2. 攻擊倍率-天賦倍率": talentAttackScale,
              "3.1. 傷害倍率-技能倍率": damageMulti,
              "3.2. 傷害倍率-天賦倍率": talentDamageMulti,
              "4.1. 削減敵方防禦-技能倍率": defDivide,
              "4.2. 削減敵方防禦-天賦倍率": talentDefDivide,
              "5.1. 無視防禦-技能倍率": defSub,
              "5.2. 無視防禦-天賦倍率": "無計算",
              "6.1. 削減敵方法抗-技能倍率": resDivide,
              "6.2. 削減敵方法抗-天賦倍率": talentResDivide,
              "7.1. 額外造成傷害-技能倍率": "無計算",
              "7.2. 額外造成傷害-天賦倍率": talentOther,
              "8.1. 保底傷害倍率-技能倍率": "無計算",
              "8.2. 保底傷害倍率-天賦倍率": talentEnsureDamage,
              "9.1. 敵人最終防禦力": finalEnemyDef,
              "9.2. 敵人最終法抗": finalEnemyRes,
              "10.1. 最終主要傷害": finalAttack,
              "10.2. 最終額外傷害": finalAttackOther,
              "10.3. 最終DPH": (finalAttack + finalAttackOther) * (damageMulti + talentDamageMulti),
            }
          ); 
        }
      }
    }

    return (finalAttack + finalAttackOther) * (damageMulti + talentDamageMulti);
  },

  //計算幹員在技能期間的DPS
  skillMemberDps: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => {
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData);
    const memberTalent = TalentsCustomCalculatorModel.talentListToAttackSkill(type, memberData)[memberData.name];
    const dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData);
    let dps = 0;

    //攻擊間隔調整
    let attackTimeRevise = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'base_attack_time'); //技能倍率
    let talentAttackTimeRevise = memberTalent?.base_attack_time || 0; //天賦倍率
    //攻速調整
    let attackSpeedRevise = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'attack_speed'); //技能倍率
    let talentAttackSpeedRevise = memberTalent?.attack_speed || 0; //天賦倍率

    //最終攻擊間隔 = (幹員攻擊間隔 + 攻擊間隔調整) / ((幹員攻速 + 攻擊速度調整) / 100)
    let finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise + talentAttackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise + talentAttackSpeedRevise) / 100);
    
    //連擊數
    let attackCount = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'ATTACK_COUNT'); //技能倍率
    attackCount = attackCount === 0 ? 1 : attackCount;
    
    //攻擊段數 (ex: 陳3技能)
    let times = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'times');
    if(times > 0){
      //對於攻擊段數類型的技能，直接以總傷來表示DPS
      dps = (dph * attackCount) * times;
    }
    else{
      dps = (dph * attackCount) / finalAttackTime;
    }

    //打印log
    if(memberData.name === CookieModel.getCookie('memberName')){  
      const skillName = SkillCalculatorModel.skillData(type, skillRow).name;
      if(CookieModel.getLog('skillMemberDps_check').includes(skillName) === false){          
        CookieModel.setLog('skillMemberDps', false);
        if(CookieModel.getLog('skillMemberDps') === false){            
          CookieModel.setLog('skillMemberDps', true);
          CookieModel.getLog('skillMemberDps_check').push(skillName);
          console.log(
            `${memberData.name}的「${skillName}」的DPS算法各項數據log`,
            {
              "0.1. 幹員原始攻擊間隔": memberNumeric.baseAttackTime,
              "0.2. 幹員原始攻速": memberNumeric.attackSpeed,
              "1.1. 攻擊間隔調整-技能倍率": attackTimeRevise,
              "1.2. 攻擊間隔調整-天賦倍率": talentAttackTimeRevise,
              "2.1. 攻速調整-技能倍率": attackSpeedRevise,
              "2.2. 攻速調整-天賦倍率": talentAttackSpeedRevise,
              "3.1. 最終攻擊間隔": finalAttackTime,
              "3.2. 連擊數-技能倍率": attackCount,
              "3.3. 攻擊段數": times,
              "5. 最終DPS": dps,
            }
          ); 
        }
      }
    }
    //還沒有適配技能CD是攻回的情境
    return dps;    
  },
  //計算幹員的技能總傷
  skillMemberTotal: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => { 
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const dps = SkillCalculatorModel.skillMemberDps(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, true);
    let duration = SkillCalculatorModel.skillData(type, skillRow).duration;
    //[技能持續時間]需要判斷 < 1 ，確保強力擊、脫手類、永續類的技能不會計算錯誤
    duration = duration < 1 ? 1 : duration;

    //攻擊段數 (ex: 陳3技能)
    let times = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'times');    
    if(times > 0){
      //對於攻擊段數類型的技能，直接以得出的DPS來表示總傷
      return dps;
    }

    //彈藥數量 (ex: 水陳3技能)
    let trigger_time = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'attack@trigger_time');
    if(trigger_time > 0){
      //對於彈藥類型的技能，再次得出DPH，並乘上彈藥數量來計算總傷
      const dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData);
      return dph * trigger_time;
    }
    
    return dps * duration; 
  },
}

export default SkillCalculatorModel;
