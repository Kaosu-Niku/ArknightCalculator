import BasicCalculatorModel from '../model/BasicCalculator';

const subProfessionIdCalculatorModel = { 
  subProfessionIdDPH: (type, memberRow, enemyData, dph) => {
    const attack = BasicCalculatorModel.memberNumeric(type, memberRow).atk;
    switch(memberRow.subProfessionId){
      case "librator": //解放者
        //非技能期間持續提升攻擊力，最高提升至300%
        dph = (attack * 3) - enemyData.enemyDef;
        dph = dph < (attack * 3) / 20 ? (attack * 3) / 20 : dph;
      break; 
      case "hunter": //獵手
        //攻擊消耗子彈但攻擊倍率提升至120%
        dph = (attack * 1.2) - enemyData.enemyDef;
        dph = dph < (attack * 1.2) / 20 ? (attack * 1.2) / 20 : dph;
      break; 
    }
    return dph
  },
  subProfessionIdDPS: (type, memberRow, enemyData, subProfessionIdJsonData, dps) => {
    const attack = BasicCalculatorModel.memberNumeric(type, memberRow).atk;
    const baseAttackTime = BasicCalculatorModel.memberNumeric(type, memberRow).baseAttackTime;
    const attackSpeed = BasicCalculatorModel.memberNumeric(type, memberRow).attackSpeed;
    const finalSpd = baseAttackTime / (attackSpeed / 100);
    const dph = BasicCalculatorModel.dph(type, memberRow, enemyData, subProfessionIdJsonData);
    let dphOther = 0;
    switch(memberRow.subProfessionId){
      case "sword": //劍豪
        //普攻造成兩次傷害
        dps = (dph * 2) / finalSpd;
      break;
      case "bombarder": //投擲手
        //普攻造成兩次傷害，第二次為攻擊力一半的傷害
        dphOther = (attack / 2) - enemyData.enemyDef;
        dphOther = dphOther < (attack / 2) / 20 ? (attack / 2) / 20 : dphOther;
        dps = (dph + dphOther) / finalSpd;
      break;
      case "funnel": //御械術師
        //使用浮游單元造成額外傷害
        //浮游單元攻擊一個新對象的首次攻擊倍率為20%攻擊力，之後每次+15%，攻擊7次達到最高110%，換對象則清除疊加

        //為方便計算，DPS算法改為 (敵人總血量 / 擊殺時間)
        let enemyHpCopy = enemyData.enemyHp;
        let attackCount = 0;
        while(enemyHpCopy > 0){              
          if(attackCount < 7){
            // 浮游單元疊加期間的計算
            dphOther = (attack * (0.2 + (0.15 * attackCount))) * ((100 - enemyData.enemyRes) / 100);
            dphOther = dphOther < (attack * (0.2 + (0.15 * attackCount))) / 20 ? (attack * (0.2 + (0.15 * attackCount))) / 20 : dphOther;
            // Y模組為浮游單元最高倍率提升為120%，所以還要算第8次，為方便計算，在第7次時一併計算            
            // if(attackCount == 7){
            //   if('mod' in row){
            //     otherDph = (row.attack * 1.2) * ((100 - emenyData.enemyRes) / 100);
            //     if(otherDph < (row.attack * 1.2) / 20){
            //       otherDph = (row.attack * 1.2) / 20;
            //     }
            //     enemyHpCopy -= dph;
            //     enemyHpCopy -= otherDph;
            //     attackCount += 1;
            //   }  
            // }
          }
          else{
            // 浮游單元疊加完畢的計算
            // if('mod' in row){
            //   otherDph = (row.attack * 1.2) * ((100 - emenyData.enemyRes) / 100);
            //   if(otherDph < (row.attack * 1.2) / 20){
            //     otherDph = (row.attack * 1.2) / 20;
            //   }
            // }
            // else{
              dphOther = (attack * 1.1) * ((100 - enemyData.enemyRes) / 100);
              dphOther = dphOther < (attack * 1.1) / 20 ? (attack * 1.1) / 20 : dphOther;
            //}                       
          }
          enemyHpCopy -= dph;
          enemyHpCopy -= dphOther;
          attackCount += 1;
        }
        dps = (enemyData.enemyHp / (finalSpd * attackCount));
      break;        
    }
    return dps
  },
  subProfessionIdHPH: (type, memberRow, enemyData, hph) => {
    const attack = BasicCalculatorModel.memberNumeric(type, memberRow).atk;
    let dph = 0;
    switch(memberRow.subProfessionId){
      case "incantationmedic": //咒癒師
        //可攻擊造成法術傷害並回復所造成的傷害50%的治療量
        dph = attack * ((100 - enemyData.enemyRes) / 100);
        dph = dph < attack / 20 ? attack / 20 : dph;
        hph = dph * 0.5;
      break;
      case "blessing": //護佑者
        //平時攻擊造成法術傷害但開技能轉為進行治療(75%攻擊力)
        hph = attack * 0.75;
      break; 
      
    }
    return hph
  },
  
}

export default subProfessionIdCalculatorModel;
