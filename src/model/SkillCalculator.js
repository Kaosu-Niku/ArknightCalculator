import BasicCalculatorModel from '../model/BasicCalculator';
import TalentsCalculatorModel from './TalentsCalculator';
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
          return item.skillId == skillId
        });
        if(checkSkill == true){
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

  //依照指定key名嘗試查詢幹員對應的技能屬性，，並回傳此技能屬性的加成值 (若查詢不到則默認回傳0)
  skillAttribute: (type, skillrow, attribute) => {
    const skillData = SkillCalculatorModel.skillData(type, skillrow);
    return skillData.blackboard?.find(entry => entry.key === attribute)?.value ?? 0;
  },

  //計算幹員在技能期間的DPH
  skillMemberDph: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, showLog = false) => {
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData);
    const memberTalent = TalentsCalculatorModel.talentListToAttackSkill(type, memberData)[memberData.name];
    const attackType = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).attackType;

    let finalAttack = 0;

    //攻擊乘算
    let attackMulti = SkillCalculatorModel.skillAttribute(type, skillRow, 'atk'); //技能倍率
    let talentAttackMulti = memberTalent?.atk || 0; //天賦倍率

    //攻擊倍率
    let attackScale = SkillCalculatorModel.skillAttribute(type, skillRow, 'atk_scale'); //技能倍率
    //需要判斷 > 0，確保原資料是0的時候不會計算出錯
    attackScale = attackScale > 0 ? attackScale : 1;
    //如果other有帶值，則表示此DPH計算是用於造成額外傷害    
    // if(other !== null){
    //   //通常造成額外傷害都是(造成一定比例傷害)和(造成固定傷害)
    //   //因此為方便計算，一律將(造成一定比例傷害)以攻擊倍率的方式來調整
    //   //(一定比例傷害不一定都低於1倍，也可能會有好幾倍的，但基本不可能會有超過10倍的，因此以10倍為界線)
    //   if(other < 10){
    //     attackScale = other;
    //   }     
    // }
    let talentAttackScale = memberTalent?.atk_scale || 0; //天賦倍率   

    //傷害倍率
    let damageMulti = SkillCalculatorModel.skillAttribute(type, skillRow, 'damage_scale'); //技能倍率
    //需要判斷 > 0，確保原資料是0的時候不會計算出錯
    damageMulti = damageMulti > 0 ? damageMulti : 1
    let talentDamageMulti = memberTalent?.damage_scale || 0; //天賦倍率 
    
    //削減敵方防禦
    let defDivide = SkillCalculatorModel.skillAttribute(type, skillRow, 'def'); //技能倍率
    let talentDefDivide = memberTalent?.def_penetrate_fixed || 0; //天賦倍率

    //無視防禦
    let defSub = SkillCalculatorModel.skillAttribute(type, skillRow, 'def_penetrate_fixed'); //技能倍率

    //削減敵方法抗       
    let resDivide = SkillCalculatorModel.skillAttribute(type, skillRow, 'magic_resistance'); //技能倍率
    let talentResDivide = memberTalent?.magic_resistance || 0; //天賦倍率
    
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
        let finalEnemyDef = enemyData.enemyDef * (1 + defDivideA + talentDefDivideA) + defDivideB + talentDefDivideB - defSub;
        //需要判斷削弱防禦與無視防禦後的敵人剩餘防禦是否 < 0
        finalEnemyDef = finalEnemyDef < 0 ? 0 : finalEnemyDef;  

        finalAttack = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) - finalEnemyDef);
        //如果other有帶值，則表示此DPH計算是用於造成額外傷害    
        // if(other !== null){
        //   //通常造成額外傷害都是(造成一定比例傷害)和(造成固定傷害)
        //   //因此為方便計算，一律將(造成固定傷害)視為不可被任何攻擊乘算跟攻擊倍率提升的物理或法術固定傷害
        //   //因此需要和敵人防禦和法抗做傷害計算，且可以被傷害倍率拐
        //   //(一定比例傷害不一定都低於1倍，也可能會有好幾倍的，但基本不可能會有超過10倍的，因此以10倍為界線)
        //   if(other > 10){
        //     finalAttack = (other - finalEnemyDef);
        //   }     
        // }
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
        let finalEnemyRes = enemyData.enemyRes * (1 + resDivideA + talentResDivideA) + resDivideB + talentResDivideB;
        //需要判斷削弱法抗後的敵人剩餘法抗是否在合理區間
        finalEnemyRes = finalEnemyRes > 100 ? 100 : finalEnemyRes;
        finalEnemyRes = finalEnemyRes < 0 ? 0 : finalEnemyRes;

        finalAttack = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) * ((100 - finalEnemyRes) / 100));
        //如果other有帶值，則表示此DPH計算是用於造成額外傷害    
        // if(other !== null){
        //   //通常造成額外傷害都是(造成一定比例傷害)和(造成固定傷害)
        //   //因此為方便計算，一律將(造成固定傷害)視為不可被任何攻擊乘算跟攻擊倍率提升的物理或法術固定傷害
        //   //因此需要和敵人防禦和法抗做傷害計算，且可以被傷害倍率拐
        //   //(一定比例傷害不一定都低於1倍，也可能會有好幾倍的，但基本不可能會有超過10倍的，因此以10倍為界線)
        //   if(other > 10){
        //     finalAttack = (other * ((100 - finalEnemyRes) / 100));
        //   }     
        // }
      break;   
    }
    
    //保底傷害倍率
    let talentEnsureDamage = memberTalent?.ensure_damage || 0.05; //天賦倍率  

    //finalAttack是計算完攻擊力加成以及扣除敵方防禦法抗後的原定傷害，而傷害公式要確保原定傷害過低時會至少有5%攻擊力的保底傷害 
    //(極少數角色具有保底傷害天賦，不只會有5%，而talentEnsureDamage就是為此處理的特別屬性)
    let ensureDamage = (memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale + talentAttackScale)) * talentEnsureDamage;
    finalAttack = finalAttack < ensureDamage ? ensureDamage : finalAttack;

    switch(attackType){
      case "治療":
        finalAttack = 0;
      break;
    }

    //打印log
    if(showLog === true){
      if(memberData.name === CookieModel.getCookie('memberName')){
        console.log(
        `${memberData.name}的「${SkillCalculatorModel.skillData(type, skillRow).name}」的DPH算法各項數據log`,
        {
          "0.1.幹員原始攻擊力": memberNumeric.atk,
          "0.2.敵人原始防禦力": enemyData.enemyDef,
          "0.3.敵人原始法抗": enemyData.enemyRes,
          "1.1.攻擊乘算-技能倍率": attackMulti,
          "1.2.攻擊乘算-天賦倍率": talentAttackMulti,
          "2.1.攻擊倍率-技能倍率": attackScale,
          "2.2.攻擊倍率-天賦倍率": talentAttackScale,
          "3.1.傷害倍率-技能倍率": damageMulti,
          "3.2.傷害倍率-天賦倍率": talentDamageMulti,
          "4.1.削減敵方防禦-技能倍率": defDivide,
          "4.2.削減敵方防禦-天賦倍率": talentDefDivide,
          "5.1.無視防禦-技能倍率": defSub,
          "5.2.無視防禦-天賦倍率": "無計算",
          "6.1.削減敵方法抗-技能倍率": resDivide,
          "6.2.削減敵方法抗-天賦倍率": talentResDivide,
          "7.1.保底傷害倍率-技能倍率": "無計算",
          "7.2.保底傷害倍率-天賦倍率": talentEnsureDamage,
          "10.最終DPH": finalAttack,
        }) 
      }
    }

    return finalAttack * (damageMulti + talentDamageMulti);
  },

  //計算幹員在技能期間的DPS
  skillMemberDps: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, showLog = false) => {
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData, showLog);
    const memberTalent = TalentsCalculatorModel.talentListToAttackSkill(type, memberData)[memberData.name];
    const dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, showLog);
    let dps = 0;

    //攻擊間隔調整
    let attackTimeRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'base_attack_time'); //技能倍率
    let talentAttackTimeRevise = memberTalent?.base_attack_time || 0; //天賦倍率
    //攻速調整
    let attackSpeedRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'attack_speed'); //技能倍率
    let talentAttackSpeedRevise = memberTalent?.attack_speed || 0; //天賦倍率

    //最終攻擊間隔 = (幹員攻擊間隔 + 攻擊間隔調整) / ((幹員攻速 + 攻擊速度調整) / 100)
    let finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise + talentAttackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise + talentAttackSpeedRevise) / 100);

    //部分幹員具有造成額外傷害的能力，對於這部分幹員，需要再計算一次額外傷害的DPH，並與原本的DPH相加後再計算DPS
    //const talentOtherDph = memberTalent?.other || 0; //天賦倍率
    
    //[攻擊次數]需要判斷 > 0 ，用於區分出固定次數傷害的技能
    let times = SkillCalculatorModel.skillAttribute(type, skillRow, 'times');
    if(times > 0){
      //對於這類技能，直接以總傷來表示DPS
      dps = dph * times;
      //return (dph + talentOtherDph) * times;
    }
    else{
      dps = dph / finalAttackTime;
      //return (dph + talentOtherDph) / finalAttackTime;
    }

    //打印log
    if(showLog === true){
      if(memberData.name === CookieModel.getCookie('memberName')){
        console.log(
        `${memberData.name}的「${SkillCalculatorModel.skillData(type, skillRow).name}」的DPS算法各項數據log`,
        {
          "0.1.幹員原始攻擊間隔": memberNumeric.baseAttackTime,
          "0.2.幹員原始攻速": memberNumeric.attackSpeed,
          "1.1.攻擊間隔調整-技能倍率": attackTimeRevise,
          "1.2.攻擊間隔調整-天賦倍率": talentAttackTimeRevise,
          "2.1.攻速調整-技能倍率": attackSpeedRevise,
          "2.2.攻速調整-天賦倍率": talentAttackSpeedRevise,
          "3.1.最終攻擊間隔": finalAttackTime,
          "3.2.攻擊次數": times,
          "5.最終DPS": dps,
        }) 
      }
    }

    return dps;
    
  },
  //計算幹員的技能總傷
  skillMemberTotal: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData) => { 
    const dps = SkillCalculatorModel.skillMemberDps(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, true);
    let duration = SkillCalculatorModel.skillData(type, skillRow).duration;
    //[技能持續時間]需要判斷 < 1 ，確保強力擊、脫手類、永續類的技能不會計算錯誤
    duration = duration < 1 ? 1 : duration;

    //[攻擊次數]需要判斷 > 0 ，用於區分出固定次數傷害的技能 
    let times = SkillCalculatorModel.skillAttribute(type, skillRow, 'times');    
    if(times > 0){
      //對於這類技能，直接以得出的DPS來表示總傷
      return dps;
    }

    //[彈藥數量]需要判斷 > 0 ，用於區分出彈藥類的的技能
    let trigger_time = SkillCalculatorModel.skillAttribute(type, skillRow, 'attack@trigger_time');
    if(trigger_time > 0){
      //對於這類技能，重新計算最終攻擊間隔以回推出DPH，並乘上彈藥數量來計算總傷
      const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
      const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData);
      let attackTimeRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'base_attack_time');
      let attackSpeedRevise = SkillCalculatorModel.skillAttribute(type, skillRow, 'attack_speed');
      let finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise) / 100);
      return (dps * finalAttackTime) * trigger_time;
    }
    
    return dps * duration; 
  },
  //部分四星的技能DPS計算還不正確
  //白雪2技能: 無法得到額外法傷的傷害倍率
  //松果2技能: 無法得到攻擊乘算
  //酸糖2技能: 無法得到2連擊
  //鉛踝2技能: 無法得到攻擊倍率
  //躍躍2技能: 無法得到2連擊
  //斷罪者1技能: 無法得到暴擊的攻擊乘算
  //斷罪者2技能: 無法得到轉法傷的攻擊倍率
  //芳汀1技能: 2連擊和傷害倍率都無法得到
  //芳汀2技能: 無法得到轉法傷的傷害倍率
  //獵蜂2技能: 攻擊間隔是減百分比卻被視為減固定間隔
  //石英2技能: 1.25是自身受傷的倍率，卻被視為傷害倍率
  //騁風2技能: 無法得到傷害倍率
  //泡泡2技能: 泡泡反傷
  //露托2技能: 無法得到轉法傷的傷害倍率  
  //深墊1&2技能: 攻擊間隔是減百分比卻被視為減固定間隔
  //深海色1: 攻擊乘算是給觸手的，不是深海色的

}

export default SkillCalculatorModel;
