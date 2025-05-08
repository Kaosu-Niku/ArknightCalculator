const MemberSpecial = {
  // 一些特定幹員因職業特性或天賦影響，DPS需另外獨立計算
  memberDpsSpecial: (row, emenyData, originalDps) => {
    let dps = originalDps;
    let dph = 0;
    let otherDph = 0;
    switch(row.name){
      case "刻刀":
        // 職業特性為攻擊皆是二連擊
        if('mod' in row){
          // Y模組為無視防禦力
          dph = row.attack - (emenyData.enemyDef - 70);
        }    
        else{
          dph = row.attack - emenyData.enemyDef;
        }
        if(dph < row.attack / 20){
          dph = row.attack / 20;
        }
        dps = (dph / (row.spd / 2));
      break;
      case "騁風":
        // 天賦為攻擊力滿疊層，攻擊附加額外傷害
        dph = row.attack - emenyData.enemyDef;
        if(dph < row.attack / 20){
          dph = row.attack / 20;
        }
        if('mod' in row){
          otherDph = (row.attack * 0.55) - emenyData.enemyDef;
          if(otherDph < (row.attack * 0.55) / 20){
            otherDph = (row.attack * 0.55) / 20;
          }
        }    
        else{
          otherDph = (row.attack * 0.28) - emenyData.enemyDef;
          if(otherDph < (row.attack * 0.28) / 20){
            otherDph = (row.attack * 0.28) / 20;
          }
        }
        dps = ((dph + otherDph) / row.spd);
      break;
      case "霜葉":        
        dph = row.attack - emenyData.enemyDef;
        if(dph < row.attack / 20){
          dph = row.attack / 20;
        }
        if('mod' in row){
          // Y模組為攻擊附加額外法術傷害
          otherDph = (row.attack * 0.1) * ((100 - emenyData.enemyRes) / 100);
          if(otherDph < (row.attack * 0.1) / 20){
            otherDph = (row.attack * 0.1) / 20;
          }
        }    
        else{
          otherDph = 0;
        }
        dps = ((dph + otherDph) / row.spd);
      break;
      case "酸糖":
        // 天賦為保底傷害
        dph = row.attack - emenyData.enemyDef;
        if('mod' in row){
          // X模組為保底更多傷害
          if(dph < row.attack * 0.5){
            dph = row.attack * 0.5;
          }
        }    
        else{
          if(dph < row.attack * 0.3){
            dph = row.attack * 0.3;
          }
        }
        dps = (dph / row.spd);
      break;  
      case "夜煙":
        // 天賦為攻擊給減法抗1秒(夜煙自身攻擊都能吃到這個加成)
        if('mod' in row){
          //X模為攻擊減更多法抗和無視法抗
          if(Math.ceil(emenyData.enemyRes * 0.7) >= 10){
            // 減法抗完>10法抗
            dph = row.attack * ((100 - (Math.ceil(emenyData.enemyRes * 0.7) - 10)) / 100);
          }
          else{
            // 減法抗完<10法抗
            dph = row.attack;
          } 
        }    
        else{
          dph = row.attack * ((100 - Math.ceil(emenyData.enemyRes * 0.87)) / 100);
        }    
        if(dph < row.attack / 20){
          dph = row.attack / 20;
        } 
        dps = (dph / row.spd);
      break;     
      case "卡達":
        // 職業特性為每次攻擊附加額外浮游單元傷害
        // 浮游單元攻擊一個新對象的首次攻擊倍率為20%攻擊力，之後每次+15%，攻擊7次達到最高110%，換對象則清除疊加
        dph = row.attack * ((100 - emenyData.enemyRes) / 100);
        if(dph < row.attack / 20){
          dph = row.attack / 20;
        }
        // 為方便計算，DPS算法改為 (敵人總血量 / 擊殺時間)
        let enemyHpCopy = emenyData.enemyHp;
        let attackCount = 0;
        while(enemyHpCopy > 0){              
          if(attackCount < 7){
            // 浮游單元疊加期間的計算
            otherDph = (row.attack * (0.2 + (0.15 * attackCount))) * ((100 - emenyData.enemyRes) / 100);
            if(otherDph < (row.attack * (0.2 + (0.15 * attackCount))) / 20){
              otherDph = (row.attack * (0.2 + (0.15 * attackCount))) / 20;
            }
            enemyHpCopy -= dph;
            enemyHpCopy -= otherDph;
            attackCount += 1;

            // Y模組為浮游單元最高倍率提升為120%，所以還要算第8次，為方便計算，在第7次時一併計算            
            if(attackCount == 7){
              if('mod' in row){
                otherDph = (row.attack * 1.2) * ((100 - emenyData.enemyRes) / 100);
                if(otherDph < (row.attack * 1.2) / 20){
                  otherDph = (row.attack * 1.2) / 20;
                }
                enemyHpCopy -= dph;
                enemyHpCopy -= otherDph;
                attackCount += 1;
              }  
            }
          }
          else{
            // 浮游單元疊加完畢的計算
            if('mod' in row){
              otherDph = (row.attack * 1.2) * ((100 - emenyData.enemyRes) / 100);
              if(otherDph < (row.attack * 1.2) / 20){
                otherDph = (row.attack * 1.2) / 20;
              }
            }
            else{
              otherDph = (row.attack * 1.1) * ((100 - emenyData.enemyRes) / 100);
              if(otherDph < (row.attack * 1.1) / 20){
                otherDph = (row.attack * 1.1) / 20;
              }
            }            
            enemyHpCopy -= dph;
            enemyHpCopy -= otherDph;
            attackCount += 1;
          }
        }
        
        dps = (emenyData.enemyHp / (row.spd * attackCount));
      break;
      case "巫役小車":
        // 天賦為部署後的40秒內每次攻擊附帶60凋亡損傷，且期間還會使攻擊範圍內所有敵人+10%法術脆弱和+10%元素脆弱
        // 而小車40秒內可以打25下，所以造成凋亡損傷的總值為1500
        // (普通與精英敵人的損傷累計值為1000，BOSS敵人的損傷累計值為2000)
        // (對普通與精英敵人來說，小車於第17下(27.2秒)打爆條)
        // (而對BOSS敵人與元素抵抗高於33%以上的敵人，則無法爆條)
        // (凋亡損傷爆條期間造成每秒800元素傷害，持續15秒，所以造成元素傷害的總傷為12000)
        // (但是小車卻還有+10%元素脆弱，所以實際上是每秒880元素傷害，實際總傷為13200)         
        dph = row.attack * ((100 - emenyData.enemyRes) / 100) * 1.1;
        if(dph < row.attack / 20){
          dph = row.attack / 20 * 1.1;
        }
        // 計算小車是否能於17下以內擊殺敵人     
        if(emenyData.enemyHp / dph < 17){
          //能擊殺，沒有觸發爆條，DPS計算只計算平A
          dps = (dph / row.spd);
        }
        else{
          //未能擊殺，觸發爆條，DPS計算另外帶入元素傷害
          let enemyHpCopy = emenyData.enemyHp;
          let attackDps = dph / row.spd
          let second = 0;
          let damageCount = 0;
          while(enemyHpCopy > 0){
            enemyHpCopy = enemyHpCopy - attackDps;
            second = second + 1;
            if(second > 27){
              // 27秒之後，每秒都會受到880元素傷害，最多15秒
              if(damageCount < 16){
                enemyHpCopy = enemyHpCopy - 880;
                damageCount = damageCount + 1;
              }  
              // 到42秒就打完小車的所有元素傷害了，再往後計算就會大量稀釋DPS而不準了，最大DPS就以42秒計
              if(second > 42){
                enemyHpCopy = -1;
              }           
            }
          }
          dps = (((attackDps * second) + (880 * damageCount)) / second);
        }
      break;
    }
    return dps;
  },
  // 一些特定幹員因職業特性或天賦影響，HPS需另外獨立計算
  memberHpsSpecial: (row, originalHps) => {
    let hps = originalHps;
    let otherHps = 0;
    switch(row.name){
      case "清流":
        if('mod' in row){
          // Y模組為治療量提升
          hps = (row.attack * 1.2) / row.spd;
        }    
      break;
      case "調香師":
        // 天賦為所有幹員每秒緩回額外治療量
        if('mod' in row){
          // Y模組為緩回更多額外治療量
          otherHps = row.attack / 100 * 7;
        }    
        else{
          otherHps = row.attack / 100 * 3.5;
        }
        hps = originalHps + otherHps;
      break;
    }
    return hps;
  },
  // 一些特定幹員因技能較為特殊，在技能期間的HPS需另外獨立計算
  defSkillHpsSpecial: (row, skillRow, enemyData, originalHps) => {
    let hps = originalHps;
    if(skillRow.skillType === "治療"){
      switch(skillRow.name){
        case "卡緹":
          if(skillRow.whichSkill === "一技能"){
            //技能為回復40%生命上限的血量(技能冷卻時間20秒)
            hps = (row.hp * 0.4) / 20;
          }      
        break;
        case "蛇屠箱":
          if(skillRow.whichSkill === "二技能"){
            //技能為每秒回復生命比例上限的血量
            if('mod' in row){
              hps = (row.hp * 0.03);
            }    
            else{
              hps = (row.hp * 0.02);
            }
          }          
        break;
        case "孑":
          if(skillRow.whichSkill === "二技能"){
            //技能為每次攻擊回復造成傷害一定量的生命值
            let dph = 0;
            dph = row.attack - enemyData.enemyDef;
            if(dph < row.attack / 20){
              dph = row.attack / 20;
            }
            if('mod' in row){
              hps = ((dph * 0.5) / row.spd);
            }    
            else{
              hps = ((dph * 0.4) / row.spd);
            }
          }          
        break;
      }
    }
    return hps;
  }
}

export default MemberSpecial;
