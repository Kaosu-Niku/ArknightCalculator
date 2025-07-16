import BasicCalculatorModel from '../model/BasicCalculator';
import SkillCustomCalculatorModel from './SkillCustomCalculator';
import TalentsCalculatorModel from './TalentsCalculator';
import TalentsCustomCalculatorModel from './TalentsCustomCalculator';
import CookieModel from './Cookie';
import UniequipCalculatorModel from './UniequipCalculator';

const SkillCalculatorModel = {
  //查詢技能所屬的幹員數據 (回傳object，詳細內容參考character_table.json)
  skillFromMember: (skillrow, characterJsonData) => {
    const skillId = skillrow.skillId;
    let checkSkill = false;
    let checkEquipid = false;
    
    //遍歷所有幹員數據，並查詢技能數據中技能Id和模組Id相符的幹員數據並回傳
    for (const key in characterJsonData) {
      if (characterJsonData.hasOwnProperty(key)){
        const currentCharacter = characterJsonData[key];
        if(skillrow.equipid){
          //有模組時，同時比對技能ID和模組ID的查詢方式
          checkSkill = currentCharacter.skills.some((item) => {
            return item.skillId === skillId 
          });
          checkEquipid = currentCharacter.equipid === skillrow.equipid;
          if(checkSkill === true && checkEquipid === true){
            return currentCharacter;
          }
          checkSkill = false;
        }
        else{
          //無模組時，只比對技能ID的預設查詢方式
          checkSkill = currentCharacter.skills.some((item) => {
            return item.skillId === skillId
          });
          if(checkSkill === true){
            return currentCharacter;
          }
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
      if(checkName in SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow, memberData)){
        if(attribute in SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow, memberData)[checkName]){
          //3. 有符合，回傳value
          return SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow, memberData)[checkName][attribute] ?? 0;
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
          if(checkName in SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow, memberData)){
            if(attribute in SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow, memberData)[checkName]){
              //4. 有符合，回傳value
              return SkillCustomCalculatorModel.skillListToAttackSkill(type, skillrow, memberData)[checkName][attribute] ?? 0;
            }
          }
          //4. 沒有符合，回傳0
          return 0;
        }
      }
      //3. 沒有符合，回傳原數值
      return skillData.blackboard?.find(entry => entry.key === attribute)?.value ?? 0;
    }
  },

  //計算幹員在技能期間的DPH 
  skillMemberDph: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false, other_atk_scale_check = null, other_attackType_check = null) => {
    //candidates_check = 是否觸發所有含有概率或是條件觸發的模組特性追加
    //如果other_atk_scale_check有值，則表示此DPH計算是經由DPS計算調用的，用於計算額外傷害而非主傷害  
    //如果other_attackType_check有值，表示此DPH計算是經由DPS計算調用的，用於轉換額外傷害的傷害類型
    const witchPhases = BasicCalculatorModel.type(type).witchPhases;
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const subProfessionName = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).chineseName;
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData, uniequipJsonData, battleEquipJsonData);
    const memberTalent = TalentsCustomCalculatorModel.talentListToAttackSkill(type, memberData)[memberData.name];
    const memberEquipBattle = UniequipCalculatorModel.memberEquipBattle(memberData, uniequipJsonData, battleEquipJsonData, skillRow.equipid);
    let blackboardList;
    //獲取模組的特性追加的數值提升數據陣列
    if(memberEquipBattle){
      const partsObject = memberEquipBattle.parts.find(obj => 
        obj.overrideTraitDataBundle && obj.overrideTraitDataBundle.candidates !== null
      );
      blackboardList = partsObject.overrideTraitDataBundle.candidates[partsObject.overrideTraitDataBundle.candidates.length - 1].blackboard;
    }

    let attackType = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).attackType;

    let finalAttack = 0;

    //攻擊乘算
    let attackMulti = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'atk'); //技能倍率
    let talentAttackMulti = memberTalent?.attack || 0; //天賦倍率

    //解放者的磨刀疊攻擊力
    if(subProfessionName === "解放者"){
      attackMulti += 2;
    }

    if(candidates_check){
      if(witchPhases === 2){
        //尖兵X模的阻擋敵人時提升攻擊力
        if(subProfessionName === "尖兵"){
          attackMulti += blackboardList?.find(item => item.key === 'atk')?.value ?? 1;
        }
      }
    }    

    //攻擊倍率
    let attackScale = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'atk_scale'); //技能倍率
    //需要判斷 > 0，確保原資料是0的時候不會計算出錯
    attackScale = attackScale > 0 ? attackScale : 1;
    let talentAttackScale = memberTalent?.atk_scale || 1; //天賦倍率 

    //獵手的攻擊消耗子彈並提升攻擊倍率
    if(subProfessionName === "獵手"){
      attackScale *= 1.2;
    }
    //散射手的攻擊前方一橫排的敵人時提升攻擊倍率
    if(subProfessionName === "散射手"){
      let other2_atk_scale = 1.5;
      //散射手X模的攻擊前方一橫排的敵人時提升更高攻擊倍率
      if(witchPhases === 2){
        other2_atk_scale = blackboardList?.find(item => item.key === 'atk_scale')?.value ?? other2_atk_scale;
      }
      attackScale *= other2_atk_scale;
    }

    if(candidates_check){
      if(witchPhases === 2){
        //衝鋒手Y模的攻擊生命低於一定比例的敵人時提升攻擊倍率
        if(subProfessionName === "衝鋒手"){
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale')?.value ?? 1;
        }
        //戰術家Y模的攻擊援軍阻擋的敵人時提升攻擊倍率
        if(subProfessionName === "戰術家"){
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale')?.value ?? 1;
        }
        //無畏者X模的攻擊阻擋的敵人時提升攻擊倍率
        if(subProfessionName === "無畏者"){
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale')?.value ?? 1;
        }
        //強攻手X模的攻擊阻擋的敵人時提升攻擊倍率
        if(subProfessionName === "強攻手"){
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale')?.value ?? 1;
        }
        //撼地者X模的濺射範圍有3名以上敵人時提升攻擊倍率
        if(subProfessionName === "撼地者"){
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale_e')?.value ?? 1;
        }
        //教官X模的攻擊自身未阻擋的敵人時提升攻擊倍率
        if(subProfessionName === "教官"){
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale')?.value ?? 1;
        } 
        //速射手X模的攻擊空中敵人時提升攻擊倍率
        if(subProfessionName === "速射手"){
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale')?.value ?? 1;
        }
        //攻城手X模的攻擊重量>3的敵人時提升攻擊倍率
        if(subProfessionName === "攻城手"){
          //目前確認到攻城手X模的角色，其模組原數據中把特性的 key value 寫在了理應是寫天賦更新的地方，導致目前的專案邏輯無法順利抓取到特性key
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale')?.value ?? 1;
        }
        //炮手X模的攻擊阻擋的敵人時提升攻擊倍率
        if(subProfessionName === "炮手"){
          attackScale *= blackboardList?.find(item => item.key === 'atk_scale')?.value ?? 1;
        }
        
        
      }
    }    

    //額外傷害的攻擊倍率
    let other_attack_scale = 1; //技能倍率

    //傷害倍率
    let damageMulti = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'damage_scale'); //技能倍率
    //需要判斷 > 0，確保原資料是0的時候不會計算出錯
    damageMulti = damageMulti > 0 ? damageMulti : 1
    let talentDamageMulti = memberTalent?.damage_scale || 1; //天賦倍率 

    if(witchPhases === 2){
      //劍豪X模的提升造成傷害
      if(subProfessionName === "劍豪"){
        damageMulti *= blackboardList?.find(item => item.key === 'damage_scale')?.value ?? 1;
      }
    }

    if(candidates_check){
      if(witchPhases === 2){
        //術戰者Y模的自身阻擋的敵人獲得一定比例的法術脆弱 (暫時將此效果視為提升傷害倍率去算)
        if(subProfessionName === "術戰者"){
          damageMulti *= blackboardList?.find(item => item.key === 'damage_scale')?.value ?? 1;
        }
        //神射手X模的攻擊距離越遠的人造成越高傷害 (明明看敘述這應該是屬於乘算類的，但是實際數據卻是給 0.15 這種屬於加算類的數據，因此此處的算式改成加法)
        if(subProfessionName === "神射手"){
          damageMulti += blackboardList?.find(item => item.key === 'damage_scale')?.value ?? 0;
        }
      }
    } 


    
    
    let finalEnemyDef = 0;
    let finalEnemyRes = 0;
    
    //削減敵方防禦
    let defDivide = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'def'); //技能倍率
    let talentDefDivide = memberTalent?.def_penetrate_fixed || 0; //天賦倍率

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
    
    //無視防禦
    let defSub = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'def_penetrate_fixed'); //技能倍率

    if(witchPhases === 2){
      //劍豪Y模的無視防禦
      if(subProfessionName === "劍豪"){
        defSub += blackboardList?.find(item => item.key === 'def_penetrate_fixed')?.value ?? 0;
      }
      //炮手Y模的無視防禦
      if(subProfessionName === "炮手"){
        defSub += blackboardList?.find(item => item.key === 'def_penetrate_fixed')?.value ?? 0;
      }
    }

    //敵人剩餘防禦
    finalEnemyDef = enemyData.enemyDef * (1 + defDivideA + talentDefDivideA) + defDivideB + talentDefDivideB - defSub;
    //需要判斷削弱防禦與無視防禦後的敵人剩餘防禦是否 < 0
    finalEnemyDef = finalEnemyDef < 0 ? 0 : finalEnemyDef;  

    //削減敵方法抗       
    let resDivide = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'magic_resistance'); //技能倍率
    let talentResDivide = memberTalent?.magic_resistance || 0; //天賦倍率

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

    if(witchPhases === 2){
      //中堅術師X模的無視法抗
      if(subProfessionName === "中堅術師"){
        resDivideB -= blackboardList?.find(item => item.key === 'magic_resist_penetrate_fixed')?.value ?? 0;
      }
    }

    //敵人剩餘法抗
    finalEnemyRes = enemyData.enemyRes * (1 + resDivideA + talentResDivideA) + resDivideB + talentResDivideB;
    //需要判斷削弱法抗後的敵人剩餘法抗是否在合理區間
    finalEnemyRes = finalEnemyRes > 100 ? 100 : finalEnemyRes;
    finalEnemyRes = finalEnemyRes < 0 ? 0 : finalEnemyRes;

    //傷害類型轉換
    let change_attackType = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'CHANGE_attackType');
    if(change_attackType){
      attackType = change_attackType;
    }

    //額外傷害的傷害類型
    //如果other_attackType_check有值，則表示此DPH計算是經由DPS計算調用的，用於轉換額外傷害的傷害類型  
    if(other_attackType_check !== null){
      attackType = other_attackType_check;
    }

    //馭法鐵衛的開啟技能轉法傷
    if(subProfessionName === "馭法鐵衛"){
      attackType = "法術";
    }
    //護佑者的開啟技能轉治療
    if(subProfessionName === "護佑者"){
      attackType = "治療";
    }
    
    switch(attackType){
      case "物理":
        //物理DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) - (敵人防禦 * (1 - 削減敵方防禦[比例]) - 削減敵方防禦[固定] - 無視防禦)) * 傷害倍率)        
        finalAttack = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale * talentAttackScale)) - finalEnemyDef);

        //如果other_atk_scale_check有值，則表示此DPH計算是經由DPS計算調用的，用於計算額外傷害而非主傷害  
        if(other_atk_scale_check !== null){
          other_attack_scale = other_atk_scale_check;
          //通常造成額外傷害都是(造成一定比例傷害)和(造成固定傷害)
          //以10為界線區分，絕對值 < 10 的值是(造成一定比例傷害)，絕對值 > 10 的值是(造成固定傷害)          
          if(other_attack_scale < 10){
            finalAttack = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale * talentAttackScale * other_attack_scale)) - finalEnemyDef);
          }
          else{
            finalAttack = (other_attack_scale - finalEnemyDef);
          }
        }
      break;
      case "法術":
        //法術DPH = (((幹員攻擊力 * (1 + 攻擊乘算) * 攻擊倍率) * ((100 - (敵人法抗 * (1 + 削減敵方法抗[比例]) + 削減敵方法抗[固定])) / 100)) * 傷害倍率)
        finalAttack = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale * talentAttackScale)) * ((100 - finalEnemyRes) / 100));

        //如果other_atk_scale_check有值，則表示此DPH計算是經由DPS計算調用的，用於計算額外傷害而非主傷害  
        if(other_atk_scale_check !== null){
          other_attack_scale = other_atk_scale_check;
          //通常造成額外傷害都是(造成一定比例傷害)和(造成固定傷害)
          //以10為界線區分，絕對值 < 10 的值是(造成一定比例傷害)，絕對值 > 10 的值是(造成固定傷害)          
          if(other_attack_scale < 10){
            finalAttack = ((memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale * talentAttackScale * other_attack_scale)) * ((100 - finalEnemyRes) / 100));
          }
          else{
            finalAttack = (other_attack_scale * ((100 - finalEnemyRes) / 100));
          }
        }
      break;   
    }
    
    //保底傷害倍率
    let talentEnsureDamage = memberTalent?.ensure_damage || 0.05; //天賦倍率  

    //finalAttack是計算完攻擊力加成以及扣除敵方防禦法抗後的原定傷害，而傷害公式要確保原定傷害過低時會至少有5%攻擊力的保底傷害 
    //(極少數角色具有保底傷害天賦，不只會有5%，而talentEnsureDamage就是為此處理的特別屬性)
    let ensureDamage = (memberNumeric.atk * (1 + attackMulti + talentAttackMulti) * (attackScale * talentAttackScale)) * talentEnsureDamage;
    finalAttack = finalAttack < ensureDamage ? ensureDamage : finalAttack;

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
      if(CookieModel.getLog('memberDph_check').includes(`${skillRow.equipid}-${skillName}`) === false){          
        CookieModel.setLog('memberDph', false);
        if(CookieModel.getLog('memberDph') === false){            
          CookieModel.setLog('memberDph', true);
          CookieModel.getLog('memberDph_check').push(`${skillRow.equipid}-${skillName}`);

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
          const equipData = UniequipCalculatorModel.memberEquipData(memberData, uniequipJsonData, skillRow.equipid);
          console.log(
            `${memberData.name}的【${equipData? equipData.uniEquipName : '無'}】模組的「${skillName}」的DPH算法各項數據log`,
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
              "7.1. 保底傷害倍率-技能倍率": "無計算",
              "7.2. 保底傷害倍率-天賦倍率": talentEnsureDamage,
              "8.1. 敵人最終防禦力": finalEnemyDef,
              "8.2. 敵人最終法抗": finalEnemyRes,
              "10. 最終DPH": finalAttack * (damageMulti * talentDamageMulti),
            }
          ); 
        }
      }
    }

    return finalAttack * (damageMulti * talentDamageMulti);
  },

  //計算幹員在技能期間的DPS
  skillMemberDps: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false) => {
    //candidates_check = 是否觸發所有含有概率或是條件觸發的模組特性追加
    const witchPhases = BasicCalculatorModel.type(type).witchPhases;
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);
    const subProfessionName = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).chineseName;
    const memberNumeric = BasicCalculatorModel.memberNumeric(type, memberData, uniequipJsonData, battleEquipJsonData, uniequipJsonData, battleEquipJsonData);
    const memberTalent = TalentsCustomCalculatorModel.talentListToAttackSkill(type, memberData)[memberData.name];
    const memberEquipBattle = UniequipCalculatorModel.memberEquipBattle(memberData, uniequipJsonData, battleEquipJsonData, skillRow.equipid);
    let blackboardList;
    //獲取模組的特性追加的數值提升數據陣列
    if(memberEquipBattle){
      const partsObject = memberEquipBattle.parts.find(obj => 
        obj.overrideTraitDataBundle && obj.overrideTraitDataBundle.candidates !== null
      );
      blackboardList = partsObject.overrideTraitDataBundle.candidates[partsObject.overrideTraitDataBundle.candidates.length - 1].blackboard;
    }

    let attackType = BasicCalculatorModel.memberSubProfessionId(memberData, subProfessionIdJsonData).attackType;
    let dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check);
    let other_skill_dph = 0; 
    let other_subProfession_dph = 0;
    let dps = 0;
    let other_skill_dps = 0;
    let other_subProfession_dps = 0;

    //攻擊間隔調整
    let attackTimeRevise = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'base_attack_time'); //技能倍率
    let talentAttackTimeRevise = memberTalent?.base_attack_time || 0; //天賦倍率
    //攻速調整
    let attackSpeedRevise = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'attack_speed'); //技能倍率
    let talentAttackSpeedRevise = memberTalent?.attack_speed || 0; //天賦倍率

    if(witchPhases === 2){
      //要塞Y模的提升攻擊速度
      if(subProfessionName === "要塞"){
        //目前確認到要塞Y模的角色，其模組原數據中把特性的 key value 寫在了理應是寫天賦更新的地方，導致目前的專案邏輯無法順利抓取到特性key
        attackSpeedRevise += blackboardList?.find(item => item.key === 'attack_speed')?.value ?? 0;
      }
    }

    if(candidates_check){
      if(witchPhases === 2){      
        //無畏者Y模的首次被擊倒不撤退並減少一定比例最大生命和提升攻擊速度
        if(subProfessionName === "無畏者"){
          attackSpeedRevise += blackboardList?.find(item => item.key === 'attack_speed')?.value ?? 0;
        }
        //術戰者X模的未阻擋敵人時提升攻擊速度
        if(subProfessionName === "術戰者"){
          attackSpeedRevise += blackboardList?.find(item => item.key === 'attack_speed')?.value ?? 0;
        }
        //鬥士Y模的生命高於一定比例時提升攻擊速度
        if(subProfessionName === "鬥士"){
          attackSpeedRevise += blackboardList?.find(item => item.key === 'attack_speed')?.value ?? 0;
        }
        //領主Y模的攻擊範圍有2名以上敵人時提升攻擊速度
        if(subProfessionName === "領主"){
          //目前確認到領主Y模的角色，其模組原數據中把特性的 key value 寫在了理應是寫天賦更新的地方，導致目前的專案邏輯無法順利抓取到特性key
          attackSpeedRevise += blackboardList?.find(item => item.key === 'attack_speed')?.value ?? 0;
        }
        //速射手Y模的攻擊範圍有地面敵人時提升攻擊速度
        if(subProfessionName === "速射手"){
          //目前確認到速射手Y模的角色，其模組原數據中把特性的 key value 寫在了理應是寫天賦更新的地方，導致目前的專案邏輯無法順利抓取到特性key
          attackSpeedRevise += blackboardList?.find(item => item.key === 'attack_speed')?.value ?? 0;
        }
      }
    }  

    //最終攻擊間隔 = (幹員攻擊間隔 + 攻擊間隔調整) / ((幹員攻速 + 攻擊速度調整) / 100)
    let finalAttackTime = (memberNumeric.baseAttackTime + attackTimeRevise + talentAttackTimeRevise) / ((memberNumeric.attackSpeed + attackSpeedRevise + talentAttackSpeedRevise) / 100);
    
    //連擊數
    let attackCount = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'ATTACK_COUNT'); //技能倍率
    attackCount = attackCount === 0 ? 1 : attackCount;

    //技能額外傷害的傷害類型
    let other_attackType = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'CHANGE_OTHER_attackType'); //技能倍率

    //技能額外傷害的攻擊倍率
    let other_attack_scale = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'OTHER_atk_scale'); //技能倍率  

    //如果other_attack_scale有值，則調用DPH計算額外造成傷害DPH    
    if(other_attack_scale !== 0){     
      other_skill_dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check, other_attack_scale, other_attackType);
    }

    //御械術師的使用浮游單元造成額外傷害
    if(subProfessionName === "御械術師"){
      let other2_atk_scale = 1.1;
      if(witchPhases === 2){
        //御械術師Y模的浮游單元傷害上限提升
        other2_atk_scale = blackboardList?.find(item => item.key === 'max_atk_scale')?.value ?? other2_atk_scale;
      }   
      other_subProfession_dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check, other2_atk_scale, attackType);             
    }

    //投擲手的造成一次額外傷害
    if(subProfessionName === "投擲手"){
      other_subProfession_dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check, 0.5, attackType);      
      if(witchPhases === 2){
        //投擲手X模的造成二次額外傷害
        let other2_atk_scale = blackboardList?.find(item => item.key === 'attack@append_atk_scale')?.value ?? 0;
        if(other2_atk_scale > 0){
          other_subProfession_dph += other_subProfession_dph;
        }        
      }
    }

    if(witchPhases === 2){
      //領主X模的造成額外法傷
      if(subProfessionName === "領主"){
        let other2_atk_scale = blackboardList?.find(item => item.key === 'atk_scale_m')?.value ?? 0;
        if(other2_atk_scale > 0){
          other_subProfession_dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check, candidates_check, other2_atk_scale, "法術");
        }                   
      }
    }

    //技能額外傷害的攻擊間隔
    let other_base_attack_time = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'OTHER_base_attack_time'); //技能倍率
    //如果other_base_attack_time有值，則視為新的攻擊間隔，無值則使用原本的最終攻擊間隔，這適用於額外造成傷害是獨立間隔的技能 (ex: 白雪2技能)    

    //預設的DPS算法: DPH / 最終攻擊間隔
    dps = (dph * attackCount) / finalAttackTime;
    other_subProfession_dps = (other_subProfession_dph * attackCount) / finalAttackTime;
    if(other_attack_scale !== 0){
      if(other_base_attack_time !== 0){     
        other_skill_dps = (other_skill_dph * attackCount) / other_base_attack_time;
        other_subProfession_dps += (other_subProfession_dph * attackCount) / other_base_attack_time;
      }
      else{
        other_skill_dps = (other_skill_dph * attackCount) / finalAttackTime;
        other_subProfession_dps += (other_subProfession_dph * attackCount) / finalAttackTime;
      }
    }   

    //技能持續時間
    let duration = SkillCalculatorModel.skillData(type, skillRow).duration;
    //[技能持續時間]需要判斷 < 1 ，確保強力擊、脫手類、永續類的技能不會計算錯誤
    duration = duration < 1 ? 1 : duration;

    //技能持續時間調整 (ex: 宴2技能如果直接套原本的技能持續時間，則總傷會計算錯誤)
    let change_duration = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'CHANGE_duration'); //技能倍率
    if(change_duration){
      duration = change_duration;
    }

    if(duration === 1){
      //此處只適用於強力擊類型的DPS計算
      //脫手類、永續類的技能需要透過自定技能屬性為技能添加CHANGE_duration將技能持續時間調整 > 1，則DPS才不會計算錯誤
      //強力擊類型的DPS直接以DPH來表示 (因為是一次性傷害，所以沒帶入攻擊間隔做計算)
      dps = (dph * attackCount);
      other_subProfession_dps = (other_subProfession_dph * attackCount);
      if(other_attack_scale !== 0){
        other_skill_dps = (other_skill_dph * attackCount);
        other_subProfession_dps += (other_subProfession_dph * attackCount);
      }     
    }

    //攻擊段數 (ex: 陳3技能)
    let times = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'times');
    if(times > 0){
      //攻擊段數類型的DPS算法: DPH * 段數
      dps = (dph * attackCount) * times;
      other_subProfession_dps = (other_subProfession_dph * attackCount) / times;
      if(other_attack_scale !== 0){
        other_skill_dps = (other_skill_dph * attackCount) * times;
        other_subProfession_dps += (other_subProfession_dph * attackCount) / times;
      }     
    }

    //打印log
    if(memberData.name === CookieModel.getCookie('memberName')){  
      const skillName = SkillCalculatorModel.skillData(type, skillRow).name;
      if(CookieModel.getLog('memberDps_check').includes(`${skillRow.equipid}-${skillName}`) === false){          
        CookieModel.setLog('memberDps', false);
        if(CookieModel.getLog('memberDps') === false){
          CookieModel.setLog('memberDps', true);
          CookieModel.getLog('memberDps_check').push(`${skillRow.equipid}-${skillName}`);

          const equipData = UniequipCalculatorModel.memberEquipData(memberData, uniequipJsonData, skillRow.equipid);
          console.log(
            `${memberData.name}的【${equipData? equipData.uniEquipName : '無'}】模組的「${skillName}」的DPS算法各項數據log`,
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
              "4.1. 技能額外傷害的傷害類型-技能倍率": other_attackType,
              "4.2. 技能額外傷害的攻擊倍率-技能倍率": other_attack_scale,
              "4.3. 技能額外傷害的攻擊間隔-技能倍率": other_base_attack_time,
              "5.1. 主傷害DPH": dph,
              "5.2. 技能額外傷害DPH": other_skill_dph,
              "5.3. 分支特性額外傷害DPH": other_subProfession_dph,
              "5.4. 主傷害DPS": dps,
              "5.5. 技能額外傷害DPS": other_skill_dps,
              "5.6. 分支特性額外傷害DPS": other_subProfession_dps,
              "10. 最終DPS": (dps + other_skill_dps + other_subProfession_dps),
            }
          ); 
        }
      }
    }
    //還沒有適配技能CD是攻回的情境
    return (dps + other_skill_dps + other_subProfession_dps);    
  },
  //計算幹員的技能總傷
  skillMemberTotal: (type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check = false) => { 
    //candidates_check = 是否觸發所有含有概率或是條件觸發的模組特性追加
    const memberData = SkillCalculatorModel.skillFromMember(skillRow, characterJsonData);

    const dps = SkillCalculatorModel.skillMemberDps(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check);
    let duration = SkillCalculatorModel.skillData(type, skillRow).duration;
    //[技能持續時間]需要判斷 < 1 ，確保強力擊、脫手類、永續類的技能不會計算錯誤
    duration = duration < 1 ? 1 : duration;
    //技能持續時間更新 (ex: 宴2技能如果直接套原本的技能持續時間，則總傷會計算錯誤)
    let change_duration = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'CHANGE_duration'); //技能倍率
    if(change_duration){
      duration = change_duration;
    }

    //攻擊段數 (ex: 陳3技能)
    let times = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'times');    
    if(times > 0){
      //攻擊段數類型的總傷直接以DPS來表示 (總傷實際上已於DPS算法中計算完成)
      return dps;
    }

    //彈藥數量 (ex: 水陳3技能)
    let trigger_time = SkillCalculatorModel.skillCustomAttribute(type, skillRow, memberData, 'attack@trigger_time');
    if(trigger_time > 0){
      //對於彈藥類型的技能，再次得出DPH，並乘上彈藥數量來計算總傷
      const dph = SkillCalculatorModel.skillMemberDph(type, skillRow, characterJsonData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates_check);
      return dph * trigger_time;
    }
    
    return dps * duration; 
  },
}

export default SkillCalculatorModel;
